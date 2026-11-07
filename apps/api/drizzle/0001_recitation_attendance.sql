DO $$
BEGIN
    CREATE TYPE recitation_attendance_status AS ENUM ('H', 'S', 'I', 'A');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS recitation_class (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

INSERT INTO recitation_class (name)
VALUES ('Belum dikelompokkan')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS recitation_student (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    nis varchar(50) UNIQUE,
    class_id uuid REFERENCES recitation_class(id),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE recitation_student
    ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES recitation_class(id);

CREATE INDEX IF NOT EXISTS recitation_student_class_active_idx
    ON recitation_student (class_id, is_active);

CREATE TABLE IF NOT EXISTS recitation_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(20) NOT NULL UNIQUE,
    scheduled_time time NOT NULL,
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recitation_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES recitation_student(id),
    session_id uuid NOT NULL REFERENCES recitation_session(id),
    date date NOT NULL,
    status recitation_attendance_status NOT NULL,
    recorded_by text NOT NULL REFERENCES "user"(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS recitation_attendance_student_session_date_unique
    ON recitation_attendance (student_id, session_id, date);

CREATE INDEX IF NOT EXISTS recitation_attendance_date_session_idx
    ON recitation_attendance (date, session_id);

INSERT INTO recitation_session (name, scheduled_time)
VALUES
    ('subuh', '04:30'),
    ('dzuhur', '12:00'),
    ('ashar', '15:30'),
    ('isya', '19:30')
ON CONFLICT (name) DO NOTHING;

INSERT INTO recitation_student (name, nis, is_active)
SELECT name, nis, status <> 'inactive'
FROM "user"
WHERE role = 'santri'
ON CONFLICT DO NOTHING;

UPDATE recitation_student
SET class_id = (SELECT id FROM recitation_class WHERE name = 'Belum dikelompokkan')
WHERE class_id IS NULL;

UPDATE access_code
SET status = 'suspended'
WHERE user_id IN (SELECT id FROM "user" WHERE role <> 'admin');

DELETE FROM session
WHERE user_id IN (SELECT id FROM "user" WHERE role <> 'admin');

DELETE FROM account
WHERE user_id IN (SELECT id FROM "user" WHERE role <> 'admin');
