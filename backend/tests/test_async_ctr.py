
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.exc import OperationalError, IntegrityError, SQLAlchemyError

from backend.app.services.async_ctr import (
    get_batch_ctr_data,
    register_impressions,
    get_total_stats,
    DatabaseConnectionError,
    CTRDataError,
)

pytestmark = pytest.mark.asyncio


class TestGetBatchCtrData:

    async def test_returns_empty_dict_when_no_data(self):
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = []
        mock_session.execute.return_value = mock_result

        result = await get_batch_ctr_data(mock_session, "test query")

        assert result == {}

    async def test_returns_ctr_data_correctly(self):
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [
            ("doc_1", 5, 100),
            ("doc_2", 10, 200),
        ]
        mock_session.execute.return_value = mock_result

        result = await get_batch_ctr_data(mock_session, "test query")

        assert result == {
            "doc_1": (5, 100),
            "doc_2": (10, 200),
        }

    async def test_raises_database_connection_error_on_operational_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = OperationalError("", "", None)

        with pytest.raises(DatabaseConnectionError):
            await get_batch_ctr_data(mock_session, "test query")

    async def test_raises_ctr_data_error_on_integrity_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = IntegrityError("", "", None)

        with pytest.raises(CTRDataError):
            await get_batch_ctr_data(mock_session, "test query")

    async def test_returns_empty_on_generic_sqlalchemy_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = SQLAlchemyError("Generic error")

        result = await get_batch_ctr_data(mock_session, "test query")

        assert result == {}

    async def test_handles_value_error_gracefully(self):
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [("doc_1", "invalid", 100)]
        mock_session.execute.return_value = mock_result

        result = await get_batch_ctr_data(mock_session, "test query")

        assert result == {}


class TestRegisterImpressions:

    async def test_does_nothing_for_empty_document_list(self):
        mock_session = AsyncMock()

        await register_impressions(mock_session, "test", 1, [])

        mock_session.execute.assert_not_called()
        mock_session.commit.assert_not_called()

    async def test_registers_impressions_in_batch(self):
        mock_session = AsyncMock()

        await register_impressions(
            mock_session, "test query", 1, ["doc_1", "doc_2", "doc_3"]
        )

        assert mock_session.execute.call_count == 2
        assert mock_session.commit.call_count == 2

    async def test_raises_database_connection_error_on_operational_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = OperationalError("", "", None)

        with pytest.raises(DatabaseConnectionError):
            await register_impressions(mock_session, "test", 1, ["doc_1"])

        mock_session.rollback.assert_called_once()

    async def test_rolls_back_on_integrity_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = IntegrityError("", "", None)

        await register_impressions(mock_session, "test", 1, ["doc_1"])

        mock_session.rollback.assert_called_once()

    async def test_rolls_back_on_generic_sqlalchemy_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = SQLAlchemyError("Generic error")

        await register_impressions(mock_session, "test", 1, ["doc_1"])

        mock_session.rollback.assert_called_once()

    async def test_generates_session_id_if_not_provided(self):
        mock_session = AsyncMock()

        await register_impressions(mock_session, "test", 1, ["doc_1"])

        first_call = mock_session.execute.call_args_list[0]
        values = first_call[0][1]
        assert values[0]["session"] is not None


class TestGetTotalStats:

    async def test_returns_stats_correctly(self):
        mock_session = AsyncMock()

        mock_result_impressions = MagicMock()
        mock_result_impressions.scalar.return_value = 1000

        mock_result_clicks = MagicMock()
        mock_result_clicks.scalar.return_value = 50

        mock_session.execute.side_effect = [
            mock_result_impressions,
            mock_result_clicks,
        ]

        result = await get_total_stats(mock_session)

        assert result == {
            "total_impressions": 1000,
            "total_clicks": 50,
        }

    async def test_returns_zeros_when_null_values(self):
        mock_session = AsyncMock()

        mock_result = MagicMock()
        mock_result.scalar.return_value = None
        mock_session.execute.return_value = mock_result

        result = await get_total_stats(mock_session)

        assert result["total_impressions"] == 0
        assert result["total_clicks"] == 0

    async def test_raises_database_connection_error_on_operational_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = OperationalError("", "", None)

        with pytest.raises(DatabaseConnectionError):
            await get_total_stats(mock_session)

    async def test_returns_zeros_on_generic_sqlalchemy_error(self):
        mock_session = AsyncMock()
        mock_session.execute.side_effect = SQLAlchemyError("Generic error")

        result = await get_total_stats(mock_session)

        assert result == {"total_impressions": 0, "total_clicks": 0}


class TestConcurrentOperations:

    async def test_multiple_impression_registrations(self):
        import asyncio

        mock_session = AsyncMock()
        call_count = 0

        async def mock_execute(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)

        mock_session.execute = mock_execute
        mock_session.commit = AsyncMock()

        tasks = [
            register_impressions(mock_session, f"query_{i}", 1, [f"doc_{i}"])
            for i in range(10)
        ]

        await asyncio.gather(*tasks)

        assert call_count == 20
