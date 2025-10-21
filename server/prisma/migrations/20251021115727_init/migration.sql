-- CreateTable
CREATE TABLE "Student" (
    "studentId" TEXT NOT NULL PRIMARY KEY,
    "nationalId" TEXT,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "gender" TEXT,
    "birthDate" TEXT,
    "birthPlace" TEXT,
    "division" TEXT,
    "curriculumYear" TEXT,
    "educationSystem" TEXT,
    "classGroupCode" TEXT,
    "statusCode" TEXT,
    "classCode" TEXT,
    "currentClass" TEXT,
    "seatNumber" TEXT,
    "specialCode" TEXT,
    "academicStatusCode" TEXT,
    "email" TEXT,
    "mobile" TEXT,
    "bloodType" TEXT,
    "mountainOrPlain" TEXT,
    "ethnicity" TEXT,
    "residenceZip" TEXT,
    "residenceAddress" TEXT,
    "residencePhone" TEXT,
    "contactZip" TEXT,
    "contactAddress" TEXT,
    "contactPhone" TEXT,
    "guardianName" TEXT,
    "guardianRelation" TEXT,
    "guardianOccupation" TEXT,
    "guardianMobile" TEXT,
    "motherMobile" TEXT,
    "fatherMobile" TEXT,
    "graduatedSchool" TEXT,
    "admissionType" TEXT,
    "educationLevel" TEXT,
    "scoreChinese" TEXT,
    "scoreEnglish" TEXT,
    "scoreMath" TEXT,
    "scoreSocial" TEXT,
    "scoreScience" TEXT,
    "scoreWriting" TEXT,
    "changeLog" JSONB,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT,
    "className" TEXT,
    "date" DATETIME NOT NULL,
    "period" TEXT,
    "status" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Counseling" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "className" TEXT,
    "counselingType" TEXT,
    "recordType" TEXT,
    "inquiryMethod" TEXT,
    "notes" TEXT,
    "contactPerson" TEXT,
    "date" DATETIME NOT NULL,
    "semester" TEXT,
    "visibleToTeacher" TEXT,
    "authorEmail" TEXT,
    "authorName" TEXT
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AssignedClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "AssignedClass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "academicYear" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "semesterId" INTEGER NOT NULL,
    CONSTRAINT "Holiday_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HolidayDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "semesterId" INTEGER NOT NULL,
    CONSTRAINT "HolidayDate_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bulletin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorEmail" TEXT NOT NULL,
    "authorName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
