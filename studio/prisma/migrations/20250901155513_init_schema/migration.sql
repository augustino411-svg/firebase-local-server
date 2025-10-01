-- CreateTable
CREATE TABLE "public"."Student" (
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "birthDate" TEXT,
    "nationalId" TEXT,
    "currentClass" TEXT,
    "seatNumber" TEXT,
    "guardianName" TEXT,
    "guardianMobile" TEXT,
    "guardianRelation" TEXT,
    "educationLevel" TEXT,
    "statusCode" TEXT,
    "contactAddress" TEXT,
    "contactPhone" TEXT,
    "contactZip" TEXT,
    "residenceAddress" TEXT,
    "residencePhone" TEXT,
    "residenceZip" TEXT,
    "mobile" TEXT,
    "fatherMobile" TEXT,
    "motherMobile" TEXT,
    "graduatedSchool" TEXT,
    "ethnicity" TEXT,
    "mountainOrPlain" TEXT,
    "bloodType" TEXT,
    "specialCode" TEXT,
    "email" TEXT,
    "changeLog" JSONB,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT,
    "className" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT,
    "status" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Counseling" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "className" TEXT,
    "counselingType" TEXT,
    "recordType" TEXT,
    "inquiryMethod" TEXT,
    "notes" TEXT,
    "contactPerson" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "semester" TEXT,
    "visibleToTeacher" TEXT,
    "authorEmail" TEXT,
    "authorName" TEXT,

    CONSTRAINT "Counseling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedClasses" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Semester" (
    "id" SERIAL NOT NULL,
    "academicYear" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "holidays" TEXT[],
    "holidayDates" TEXT[],

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bulletin" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorEmail" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,

    CONSTRAINT "Bulletin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
