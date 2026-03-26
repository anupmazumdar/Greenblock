from statistics import mean, pstdev


def detect_anomalies(values: list[float], z_threshold: float = 2.5) -> list[int]:
    """Return indices of values that exceed a simple z-score threshold."""
    if not values:
        return []
    mu = mean(values)
    sigma = pstdev(values)
    if sigma == 0:
        return []

    anomalies = []
    for idx, value in enumerate(values):
        z = abs((value - mu) / sigma)
        if z >= z_threshold:
            anomalies.append(idx)
    return anomalies
