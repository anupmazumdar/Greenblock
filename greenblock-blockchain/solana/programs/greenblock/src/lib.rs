use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer},
};

declare_id!("GreenBLKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

// India CEA 2023: 0.82 kg CO₂/kWh → in lamports (9 decimals): 820_000_000
const GBT_LAMPORTS_PER_KWH: u64 = 820_000_000;
const MAX_KWH_PER_CLAIM: u64   = 50_000;
const CLAIM_PREFIX: &[u8]      = b"greenblock";

#[program]
pub mod greenblock {
    use super::*;
    use anchor_lang::solana_program::{
        ed25519_program,
        sysvar::instructions::{load_instruction_at_checked, ID as SYSVAR_INSTRUCTIONS_ID},
    };

    // ── Registry: initialise ──────────────────────────────────────────────────

    pub fn initialize_registry(
        ctx: Context<InitializeRegistry>,
        oracle_pubkey: [u8; 32],
    ) -> Result<()> {
        let reg = &mut ctx.accounts.registry;
        reg.oracle_pubkey    = oracle_pubkey;
        reg.gbt_mint         = ctx.accounts.gbt_mint.key();
        reg.total_gbt_minted = 0;
        reg.total_kwh_saved  = 0;
        reg.total_buildings  = 0;
        reg.bump             = ctx.bumps.registry;
        Ok(())
    }

    // ── Registry: register building ──────────────────────────────────────────

    pub fn register_building(
        ctx: Context<RegisterBuilding>,
        building_id: String,
        location:    String,
        baseline_kwh_month: u64,
    ) -> Result<()> {
        require!(building_id.len() <= 64, GreenBlockError::StringTooLong);
        require!(location.len() <= 128,   GreenBlockError::StringTooLong);
        require!(baseline_kwh_month > 0,  GreenBlockError::InvalidAmount);

        let b = &mut ctx.accounts.building;
        b.owner              = ctx.accounts.owner.key();
        b.building_id        = building_id;
        b.location           = location;
        b.baseline_kwh_month = baseline_kwh_month;
        b.kwh_saved_total    = 0;
        b.gbt_claimed        = 0;
        b.registered_at      = Clock::get()?.unix_timestamp;
        b.bump               = ctx.bumps.building;

        let reg = &mut ctx.accounts.registry;
        reg.total_buildings  += 1;
        Ok(())
    }

    // ── Registry: claim credits ───────────────────────────────────────────────
    //
    // The caller must prepend an Ed25519 signature verification instruction
    // (using the Solana Ed25519 native program) to the transaction before
    // calling this instruction.  We verify the preceding ix here.
    //
    // Claim message = b"greenblock" || owner_pubkey(32) || kwh_saved(8 LE) || nonce(8 LE)

    pub fn claim_credits(
        ctx:      Context<ClaimCredits>,
        kwh_saved: u64,
        nonce:     u64,
        _sig:      [u8; 64],   // passed for IDL completeness; verified via sysvar
    ) -> Result<()> {
        require!(kwh_saved > 0 && kwh_saved <= MAX_KWH_PER_CLAIM, GreenBlockError::InvalidAmount);

        // Build the expected message
        let owner_bytes = ctx.accounts.owner.key().to_bytes();
        let mut msg = Vec::with_capacity(CLAIM_PREFIX.len() + 32 + 8 + 8);
        msg.extend_from_slice(CLAIM_PREFIX);
        msg.extend_from_slice(&owner_bytes);
        msg.extend_from_slice(&kwh_saved.to_le_bytes());
        msg.extend_from_slice(&nonce.to_le_bytes());

        // Verify the Ed25519 instruction that must precede this one
        let ix_sysvar = &ctx.accounts.ix_sysvar;
        let ed_ix     = load_instruction_at_checked(0, ix_sysvar)?;

        require_keys_eq!(ed_ix.program_id, ed25519_program::id(), GreenBlockError::BadSignature);

        let data = &ed_ix.data;
        // Ed25519 ix data layout: [num_sigs(1), pad(1), sig_offset(2), sig_ix(2),
        //   pk_offset(2), pk_ix(2), msg_offset(2), msg_len(2), msg_ix(2), sig(64), pk(32), msg...]
        let num_sigs = data[0] as usize;
        require!(num_sigs == 1, GreenBlockError::BadSignature);

        let pk_offset  = u16::from_le_bytes([data[6], data[7]])  as usize;
        let msg_offset = u16::from_le_bytes([data[10], data[11]]) as usize;
        let msg_len    = u16::from_le_bytes([data[12], data[13]]) as usize;

        let pk_in_ix  = &data[pk_offset..pk_offset + 32];
        let msg_in_ix = &data[msg_offset..msg_offset + msg_len];

        let oracle_pk = ctx.accounts.registry.oracle_pubkey;
        require!(pk_in_ix  == oracle_pk, GreenBlockError::BadSignature);
        require!(msg_in_ix == msg.as_slice(), GreenBlockError::BadSignature);

        // Mint GBT
        let gbt_amount = kwh_saved
            .checked_mul(GBT_LAMPORTS_PER_KWH)
            .ok_or(GreenBlockError::Overflow)?;

        let seeds: &[&[u8]] = &[b"registry", &[ctx.accounts.registry.bump]];
        let signer           = &[seeds];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint:      ctx.accounts.gbt_mint.to_account_info(),
                    to:        ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.registry.to_account_info(),
                },
                signer,
            ),
            gbt_amount,
        )?;

        // Update state
        let b   = &mut ctx.accounts.building;
        b.kwh_saved_total = b.kwh_saved_total.checked_add(kwh_saved).ok_or(GreenBlockError::Overflow)?;
        b.gbt_claimed     = b.gbt_claimed.checked_add(gbt_amount).ok_or(GreenBlockError::Overflow)?;

        let reg = &mut ctx.accounts.registry;
        reg.total_gbt_minted = reg.total_gbt_minted.checked_add(gbt_amount).ok_or(GreenBlockError::Overflow)?;
        reg.total_kwh_saved  = reg.total_kwh_saved.checked_add(kwh_saved).ok_or(GreenBlockError::Overflow)?;

        emit!(CreditsClaimedEvent {
            owner:      ctx.accounts.owner.key(),
            kwh_saved,
            gbt_amount,
            nonce,
            timestamp:  Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // ── Marketplace: list credits ─────────────────────────────────────────────

    pub fn list_credits(
        ctx:          Context<ListCredits>,
        amount_gbt:   u64,
        price_per_gbt_lamports: u64,
    ) -> Result<()> {
        require!(amount_gbt > 0,             GreenBlockError::InvalidAmount);
        require!(price_per_gbt_lamports > 0, GreenBlockError::InvalidAmount);

        // Escrow GBT to vault
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.seller_token.to_account_info(),
                    to:        ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            amount_gbt,
        )?;

        let l = &mut ctx.accounts.listing;
        l.seller                  = ctx.accounts.seller.key();
        l.amount_gbt              = amount_gbt;
        l.price_per_gbt_lamports  = price_per_gbt_lamports;
        l.active                  = true;
        l.created_at              = Clock::get()?.unix_timestamp;
        l.bump                    = ctx.bumps.listing;
        l.vault_bump              = ctx.bumps.vault;

        Ok(())
    }

    // ── Marketplace: buy credits ──────────────────────────────────────────────

    pub fn buy_credits(
        ctx:        Context<BuyCredits>,
        amount_gbt: u64,
    ) -> Result<()> {
        let listing = &ctx.accounts.listing;
        require!(listing.active,                   GreenBlockError::ListingInactive);
        require!(amount_gbt <= listing.amount_gbt, GreenBlockError::InvalidAmount);
        require!(amount_gbt > 0,                   GreenBlockError::InvalidAmount);

        let total_lamports = amount_gbt
            .checked_mul(listing.price_per_gbt_lamports)
            .ok_or(GreenBlockError::Overflow)?;
        let fee_lamports = total_lamports / 100;   // 1 % fee
        let seller_lamports = total_lamports.checked_sub(fee_lamports).ok_or(GreenBlockError::Overflow)?;

        // Transfer SOL to seller
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to:   ctx.accounts.seller.to_account_info(),
                },
            ),
            seller_lamports,
        )?;

        // Transfer GBT from vault to buyer
        let listing_key = ctx.accounts.listing.key();
        let seeds: &[&[u8]] = &[b"vault", listing_key.as_ref(), &[ctx.accounts.listing.vault_bump]];
        let signer = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault.to_account_info(),
                    to:        ctx.accounts.buyer_token.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            ),
            amount_gbt,
        )?;

        let l = &mut ctx.accounts.listing;
        l.amount_gbt = l.amount_gbt.checked_sub(amount_gbt).ok_or(GreenBlockError::Overflow)?;
        if l.amount_gbt == 0 {
            l.active = false;
        }

        Ok(())
    }

    // ── Marketplace: cancel listing ───────────────────────────────────────────

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        require!(ctx.accounts.listing.active, GreenBlockError::ListingInactive);

        let listing_key = ctx.accounts.listing.key();
        let seeds: &[&[u8]] = &[b"vault", listing_key.as_ref(), &[ctx.accounts.listing.vault_bump]];
        let signer = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault.to_account_info(),
                    to:        ctx.accounts.seller_token.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            ),
            ctx.accounts.listing.amount_gbt,
        )?;

        let l = &mut ctx.accounts.listing;
        l.amount_gbt = 0;
        l.active     = false;
        Ok(())
    }

    // ── Retirement: retire and certify ────────────────────────────────────────

    pub fn retire_and_certify(
        ctx:         Context<RetireAndCertify>,
        amount_gbt:  u64,
        building_id: String,
        ipfs_cid:    String,
    ) -> Result<()> {
        require!(amount_gbt > 0,       GreenBlockError::InvalidAmount);
        require!(ipfs_cid.len() <= 64, GreenBlockError::StringTooLong);

        // Burn GBT
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint:      ctx.accounts.gbt_mint.to_account_info(),
                    from:      ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount_gbt,
        )?;

        let ledger = &mut ctx.accounts.ledger;
        let cert_id = ledger.next_cert_id;

        let cert = &mut ctx.accounts.certificate;
        cert.id          = cert_id;
        cert.owner       = ctx.accounts.owner.key();
        cert.amount_gbt  = amount_gbt;
        // kg CO₂ = amount_gbt / 1e9 (9 decimals SPL) * 1 kg/GBT → in milligrams for integer
        cert.kg_co2_mg   = amount_gbt / 1_000_000;   // milligrams (amount_gbt has 9 decimals)
        cert.building_id = building_id;
        cert.ipfs_cid    = ipfs_cid;
        cert.retired_at  = Clock::get()?.unix_timestamp;
        cert.bump        = ctx.bumps.certificate;

        ledger.next_cert_id    = cert_id.checked_add(1).ok_or(GreenBlockError::Overflow)?;
        ledger.total_gbt_retired = ledger.total_gbt_retired.checked_add(amount_gbt).ok_or(GreenBlockError::Overflow)?;

        emit!(CertificateIssuedEvent {
            cert_id,
            owner:      ctx.accounts.owner.key(),
            amount_gbt,
            retired_at: cert.retired_at,
        });

        Ok(())
    }
}

// ─── Account structs ──────────────────────────────────────────────────────────

#[account]
pub struct Registry {
    pub oracle_pubkey:    [u8; 32],
    pub gbt_mint:         Pubkey,
    pub total_gbt_minted: u64,
    pub total_kwh_saved:  u64,
    pub total_buildings:  u64,
    pub bump:             u8,
}

#[account]
pub struct Building {
    pub owner:              Pubkey,
    pub building_id:        String,   // max 64
    pub location:           String,   // max 128
    pub baseline_kwh_month: u64,
    pub kwh_saved_total:    u64,
    pub gbt_claimed:        u64,
    pub registered_at:      i64,
    pub bump:               u8,
}

#[account]
pub struct Listing {
    pub seller:                 Pubkey,
    pub amount_gbt:             u64,
    pub price_per_gbt_lamports: u64,
    pub active:                 bool,
    pub created_at:             i64,
    pub bump:                   u8,
    pub vault_bump:             u8,
}

#[account]
pub struct RetirementLedger {
    pub next_cert_id:      u64,
    pub total_gbt_retired: u64,
    pub gbt_mint:          Pubkey,
    pub bump:              u8,
}

#[account]
pub struct Certificate {
    pub id:          u64,
    pub owner:       Pubkey,
    pub amount_gbt:  u64,
    pub kg_co2_mg:   u64,
    pub building_id: String,   // max 64
    pub ipfs_cid:    String,   // max 64
    pub retired_at:  i64,
    pub bump:        u8,
}

// ─── Context definitions ──────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer  = payer,
        space  = 8 + 32 + 32 + 8 + 8 + 8 + 1,
        seeds  = [b"registry"],
        bump,
    )]
    pub registry: Account<'info, Registry>,

    #[account(
        init,
        payer      = payer,
        mint::decimals  = 9,
        mint::authority = registry,
    )]
    pub gbt_mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program:  Program<'info, System>,
    pub token_program:   Program<'info, Token>,
    pub rent:            Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(building_id: String, location: String)]
pub struct RegisterBuilding<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 4 + 64 + 4 + 128 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"building", owner.key().as_ref()],
        bump,
    )]
    pub building: Account<'info, Building>,

    #[account(mut, seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimCredits<'info> {
    #[account(mut, seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,

    #[account(
        mut,
        seeds  = [b"building", owner.key().as_ref()],
        bump   = building.bump,
        has_one = owner,
    )]
    pub building: Account<'info, Building>,

    #[account(
        mut,
        mint::authority = registry,
        address         = registry.gbt_mint,
    )]
    pub gbt_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer                    = owner,
        associated_token::mint   = gbt_mint,
        associated_token::authority = owner,
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: validated manually against SYSVAR_INSTRUCTIONS_ID
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub ix_sysvar: AccountInfo<'info>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
    pub rent:                     Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ListCredits<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 8 + 8 + 1 + 8 + 1 + 1,
        seeds = [b"listing", seller.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        init,
        payer              = seller,
        token::mint        = gbt_mint,
        token::authority   = vault,
        seeds              = [b"vault", listing.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint      = gbt_mint,
        associated_token::authority = seller,
    )]
    pub seller_token: Account<'info, TokenAccount>,

    pub gbt_mint: Account<'info, Mint>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
    pub rent:                     Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyCredits<'info> {
    #[account(mut, has_one = seller)]
    pub listing: Account<'info, Listing>,

    #[account(
        mut,
        seeds  = [b"vault", listing.key().as_ref()],
        bump   = listing.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer                    = buyer,
        associated_token::mint   = gbt_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token: Account<'info, TokenAccount>,

    pub gbt_mint: Account<'info, Mint>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: lamports destination
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
    pub rent:                     Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut, has_one = seller)]
    pub listing: Account<'info, Listing>,

    #[account(
        mut,
        seeds = [b"vault", listing.key().as_ref()],
        bump  = listing.vault_bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint      = gbt_mint,
        associated_token::authority = seller,
    )]
    pub seller_token: Account<'info, TokenAccount>,

    pub gbt_mint: Account<'info, Mint>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RetireAndCertify<'info> {
    #[account(mut, seeds = [b"ledger"], bump = ledger.bump)]
    pub ledger: Account<'info, RetirementLedger>,

    #[account(
        init,
        payer = owner,
        space = 8 + 8 + 32 + 8 + 8 + 4 + 64 + 4 + 64 + 8 + 1,
        seeds = [b"cert", owner.key().as_ref(), &ledger.next_cert_id.to_le_bytes()],
        bump,
    )]
    pub certificate: Account<'info, Certificate>,

    #[account(mut, address = ledger.gbt_mint)]
    pub gbt_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint      = gbt_mint,
        associated_token::authority = owner,
    )]
    pub owner_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent:           Sysvar<'info, Rent>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct CreditsClaimedEvent {
    pub owner:      Pubkey,
    pub kwh_saved:  u64,
    pub gbt_amount: u64,
    pub nonce:      u64,
    pub timestamp:  i64,
}

#[event]
pub struct CertificateIssuedEvent {
    pub cert_id:    u64,
    pub owner:      Pubkey,
    pub amount_gbt: u64,
    pub retired_at: i64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum GreenBlockError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Oracle signature verification failed")]
    BadSignature,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Listing is not active")]
    ListingInactive,
    #[msg("String exceeds maximum length")]
    StringTooLong,
}
