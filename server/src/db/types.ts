
import type { ColumnType, Generated } from 'kysely';

export interface UsersTable {
  user_id: Generated<number>;
  username: string;
  email: string;
  password_hash: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface DepartmentsTable {
  department_id: Generated<number>;
  department_name: string;
}

export interface ProfessorsTable {
  professor_id: Generated<number>;
  department_id: number;
  name: string;
}

export interface CoursesTable {
  course_id: Generated<number>;
  department_id: number;
  course_code: string;
  course_name: string;
}

export interface ProfessorCoursesTable {
  professor_id: number;
  course_id: number;
}

export interface ReviewsTable {
  review_id: Generated<number>;
  user_id: number;
  professor_id: number;
  course_id: number;
  date_written: ColumnType<Date, string | undefined, string | undefined>;
  overall_rating: number;
  grade: string | null;
  difficulty: number;
  textbook_used: boolean;
  semester: string;
  workload: string | null;
  skills: string[] | null;
  time_commitment: number | null;
  usefulness: number;
  review_text: string | null;
}

export interface Database {
  users: UsersTable;
  departments: DepartmentsTable;
  professors: ProfessorsTable;
  courses: CoursesTable;
  professor_courses: ProfessorCoursesTable;
  reviews: ReviewsTable;
}
