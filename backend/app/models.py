
from sqlalchemy import Column, Integer, String, Text, ARRAY, TIMESTAMP, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base


class User(Base):

    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), nullable=False)
    specialization = Column(String(100))
    faculty = Column(String(200))
    course = Column(Integer)
    interests = Column(ARRAY(Text))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    search_queries = relationship("SearchQuery", back_populates="user", lazy="dynamic")
    clicks = relationship("Click", back_populates="user", lazy="dynamic")
    impressions = relationship("Impression", back_populates="user", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role})>"


class Document(Base):

    __tablename__ = "documents"

    document_id = Column(String(50), primary_key=True)
    title = Column(Text, nullable=False)
    authors = Column(ARRAY(Text))
    document_type = Column(String(50), nullable=False)
    year = Column(Integer)
    subject = Column(String(100))
    abstract = Column(Text)
    isbn = Column(String(20))
    doi = Column(String(100))
    pages = Column(Integer)
    language = Column(String(10), default='ru')
    indexed_at = Column(TIMESTAMP, server_default=func.now())

    clicks = relationship("Click", back_populates="document", lazy="dynamic")
    impressions = relationship("Impression", back_populates="document", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Document {self.document_id}: {self.title[:50]}...>"


class SearchQuery(Base):

    __tablename__ = "search_queries"

    query_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    query_text = Column(Text, nullable=False, index=True)
    results_count = Column(Integer)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    session_id = Column(String(100), index=True)

    user = relationship("User", back_populates="search_queries")
    clicks = relationship("Click", back_populates="search_query", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<SearchQuery {self.query_id}: '{self.query_text[:30]}...'>"


class Click(Base):

    __tablename__ = "clicks"

    click_id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("search_queries.query_id"), index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    document_id = Column(String(50), ForeignKey("documents.document_id"), index=True)
    query_text = Column(Text, nullable=False, index=True)
    position = Column(Integer, nullable=False)
    clicked_at = Column(TIMESTAMP, server_default=func.now())
    dwell_time = Column(Integer)
    session_id = Column(String(100), index=True)

    search_query = relationship("SearchQuery", back_populates="clicks")
    user = relationship("User", back_populates="clicks")
    document = relationship("Document", back_populates="clicks")

    def __repr__(self) -> str:
        return f"<Click {self.click_id}: doc={self.document_id} pos={self.position}>"


class Impression(Base):

    __tablename__ = "impressions"

    impression_id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("search_queries.query_id"), index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    document_id = Column(String(50), ForeignKey("documents.document_id"), index=True)
    query_text = Column(Text, nullable=False, index=True)
    position = Column(Integer, nullable=False)
    shown_at = Column(TIMESTAMP, server_default=func.now())
    session_id = Column(String(100), index=True)

    user = relationship("User", back_populates="impressions")
    document = relationship("Document", back_populates="impressions")

    def __repr__(self) -> str:
        return f"<Impression {self.impression_id}: doc={self.document_id} pos={self.position}>"
