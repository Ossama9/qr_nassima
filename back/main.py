from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, ForeignKey, create_engine, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
import jwt
import datetime

# Configuration de la base de données
DATABASE_URL = "sqlite:///./users.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modèle utilisateur
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="student")  # Ajout du rôle avec "student" par défaut
    attendances = relationship("Attendance", back_populates="user")


class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    confirmed = Column(Integer, default=0)  # 0 = non confirmé, 1 = confirmé
    user = relationship("User", back_populates="attendances")


class QRCode(Base):
    __tablename__ = "qrcodes"
    id = Column(Integer, primary_key=True, index=True)
    course = Column(String, index=True)  # Nom du cours
    qr_value = Column(String, unique=True)  # Valeur du QR code (URL)
    user_id = Column(Integer, ForeignKey("users.id"))  # ID de l'enseignant qui a généré le QR
    created_at = Column(DateTime, default=datetime.datetime.utcnow)  # Date de création

    user = relationship("User")  # Relation avec User


Base.metadata.create_all(bind=engine)

# Sécurité
SECRET_KEY = "secret_key"  # 🔐 À changer !
ALGORITHM = "HS256"
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def hash_password(password: str):
    return password_context.hash(password)

def verify_password(plain_password, hashed_password):
    return password_context.verify(plain_password, hashed_password)

def create_access_token(email: str):
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    return jwt.encode({"sub": email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

class UserRegister(BaseModel):
    email: str
    password: str
    role: str = "student"  # Par défaut, tout utilisateur est un étudiant

class UserLogin(BaseModel):
    email: str
    password: str

class AttendanceSchema(BaseModel):
    email: str
    course: str

class QRCodeSchema(BaseModel):
    email: str
    course: str
    qr_value: str  # Lien généré du QR code

# FastAPI App
app = FastAPI()

# Configuration CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/generate_qr")
def generate_qr(qr_data: QRCodeSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == qr_data.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can generate QR codes")

    existing_qr = db.query(QRCode).filter(QRCode.qr_value == qr_data.qr_value).first()
    if existing_qr:
        raise HTTPException(status_code=400, detail="QR Code already exists")

    new_qr = QRCode(course=qr_data.course, qr_value=qr_data.qr_value, user_id=user.id)
    db.add(new_qr)
    db.commit()
    db.refresh(new_qr)

    return {"message": "QR Code saved successfully", "qr_id": new_qr.id, "user_id": new_qr.user_id}


@app.get("/qrcodes")
def get_qrcodes(db: Session = Depends(get_db)):
    qrcodes = db.query(QRCode).all()
    return [
        {
            "id": qr.id,
            "course": qr.course,
            "qr_value": qr.qr_value,
            "user_id": qr.user_id,  # ID de l'enseignant
            "teacher_email": qr.user.email if qr.user else None,  # Email de l'enseignant
            "created_at": qr.created_at
        }
        for qr in qrcodes
    ]


@app.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already taken")
    
    hashed_password = hash_password(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "role": new_user.role}


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/attendance")
def mark_attendance(attendance: AttendanceSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == attendance.email, User.role == "student").first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    new_attendance = Attendance(user_id=user.id, course=attendance.course)
    db.add(new_attendance)
    db.commit()
    return {"message": "Attendance recorded successfully"}



@app.get("/attendance/{course}")
def get_attendance(course: str, db: Session = Depends(get_db)):
    attendances = db.query(Attendance).filter(Attendance.course == course).all()
    return attendances

@app.get("/absentees")
def get_absentees(db: Session = Depends(get_db)):
    # Récupérer le nombre total de QR codes générés (donc de cours organisés)
    total_courses = db.query(QRCode).count()

    if total_courses == 0:
        return {"message": "Aucun cours n'a été généré"}

    # Récupérer tous les étudiants
    students = db.query(User).filter(User.role == "student").all()
    
    absentees = []
    
    for student in students:
        # Compter combien de fois cet étudiant a confirmé sa présence
        attendance_count = db.query(Attendance).filter(
            Attendance.user_id == student.id,
            Attendance.confirmed == 1  # Seules les présences confirmées comptent
        ).count()
        
        # Calculer le nombre d'absences
        absences = total_courses - attendance_count
        
        if absences > 0:
            absentees.append({
                "user_id": student.id,
                "email": student.email,
                "absences": absences
            })

    return absentees


@app.get("/attendances")
def get_all_attendances(db: Session = Depends(get_db)):
    attendances = db.query(Attendance).all()
    return [
        {"id": a.id, "user_id": a.user_id, "course": a.course, "timestamp": a.timestamp}
        for a in attendances
    ]


@app.post("/confirm_attendance")
def confirm_attendance(
    attendance_data: dict,
    db: Session = Depends(get_db)
):
    email = attendance_data.get("email")
    course = attendance_data.get("course")

    if not email or not course:
        raise HTTPException(status_code=400, detail="Email and course are required")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Vérifier si l'étudiant a déjà confirmé sa présence
    existing_attendance = db.query(Attendance).filter(
        Attendance.user_id == user.id,
        Attendance.course == course
    ).first()

    if existing_attendance:
        if existing_attendance.confirmed == 1:
            return {"success": True, "message": "Attendance already confirmed"}
        
        # Si la présence existe mais n'est pas confirmée, on la valide
        existing_attendance.confirmed = 1
        db.commit()
        return {"success": True, "message": "Attendance confirmed successfully"}

    # Si aucune présence n'existe, on l'enregistre et on la confirme immédiatement
    new_attendance = Attendance(user_id=user.id, course=course, confirmed=1)
    db.add(new_attendance)
    db.commit()
    
    return {"success": True, "message": "Attendance created and confirmed successfully"}








def create_default_user():
    """Crée un utilisateur par défaut si aucun n'existe."""
    db = SessionLocal()
    existing_user = db.query(User).filter(User.email == "admin@example.com").first()

    if not existing_user:
        hashed_password = hash_password("admin123")
        new_user = User(email="admin@example.com", hashed_password=hashed_password, role="teacher")
        db.add(new_user)
        db.commit()
        print("👤 Default admin user created: admin@example.com / admin123")
    else:
        print("✅ Admin user already exists.")
    
    db.close()

# Exécuter cette fonction après le lancement
create_default_user()
