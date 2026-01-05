
class CTRServiceError(Exception):
    """Base exception for CTR service errors."""
    pass


class DatabaseConnectionError(CTRServiceError):
    """Raised when database connection fails."""
    pass


class CTRDataError(CTRServiceError):
    """Raised when CTR data retrieval fails."""
    pass
