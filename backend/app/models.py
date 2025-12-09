from sqlalchemy import Column, Integer, String, Text, ARRAY, TIMESTAMP, ForeignKey, Float
from sqlalchemy.sql import func
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), nullable=False)
    specialization = Column(String(100))
    course = Column(Integer)
    interests = Column(ARRAY(Text))
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())

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

class SearchQuery(Base):
    __tablename__ = "search_queries"
    
    query_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    query_text = Column(Text, nullable=False)
    results_count = Column(Integer)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    session_id = Column(String(100))

class Click(Base):
    __tablename__ = "clicks"
    
    click_id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("search_queries.query_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    document_id = Column(String(50), ForeignKey("documents.document_id"))
    query_text = Column(Text, nullable=False)
    position = Column(Integer, nullable=False)
    clicked_at = Column(TIMESTAMP, server_default=func.now())
    dwell_time = Column(Integer)
    session_id = Column(String(100))

class Impression(Base):
    __tablename__ = "impressions"
    
    impression_id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("search_queries.query_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    document_id = Column(String(50), ForeignKey("documents.document_id"))
    query_text = Column(Text, nullable=False)
    position = Column(Integer, nullable=False)
    shown_at = Column(TIMESTAMP, server_default=func.now())
    session_id = Column(String(100))
