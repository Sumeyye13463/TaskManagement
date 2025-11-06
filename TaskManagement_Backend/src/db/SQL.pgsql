-- TÜM İÇERİĞİ SİL
/*DROP SCHEMA public CASCADE;

-- public'u yeniden oluştur
CREATE SCHEMA public;

--1 USERS
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username   TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  title      TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION CURRENT_USER;

GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO public;

SELECT * FROM public.users;

-- 2) CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  contact_name  TEXT,
  contact_email TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3) PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  client_id   BIGINT REFERENCES public.clients(id) ON DELETE SET NULL,
  manager_id  BIGINT REFERENCES public.users(id)   ON DELETE SET NULL,
  start_date  DATE,
  end_date    DATE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_project_name_per_client UNIQUE (client_id, name)
);
CREATE INDEX IF NOT EXISTS idx_projects_client  ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(manager_id);

-- 4) PROJECT_MEMBERS  (köprü tablo)
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  role       TEXT    NOT NULL DEFAULT 'member',
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_projmembers_user ON public.project_members(user_id);

-- LABELS: proje bazlı etiket havuzu / Aynı projede aynı isimli etiketi önlemek için UNIQUE (project_id, name) koyduk.
CREATE TABLE IF NOT EXISTS public.labels (
  id         BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color_hex  TEXT,                       
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_label_per_project UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labels_project ON public.labels(project_id);


-- TASKS (görevler)
CREATE TABLE IF NOT EXISTS public.tasks (
  id           BIGSERIAL PRIMARY KEY,
  project_id   BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title        TEXT   NOT NULL,
  description  TEXT,
  status       TEXT   NOT NULL DEFAULT 'todo',   -- todo | in_progress | blocked | done
  created_by   BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  estimate_min INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tasks_project  ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due      ON public.tasks(created_at); -- basit zaman filtresi için


-- Göreve çoklu atama
CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id   BIGINT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id   BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_taskassignees_user ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_taskassignees_task ON public.task_assignees(task_id);

-- Görev ↔ Etiket bağlantısı
CREATE TABLE IF NOT EXISTS public.task_labels (
  task_id  BIGINT NOT NULL REFERENCES public.tasks(id)  ON DELETE CASCADE,
  label_id BIGINT NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_tasklabels_label ON public.task_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_tasklabels_task  ON public.task_labels(task_id);

-- users tablosuna role ve mfa_enabled alanlarını ekle
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;

-- Rol setini sınırla (admin | manager | member | viewer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT chk_users_role
      CHECK (role IN ('admin','manager','member','viewer'));
  END IF;
END$$;

-- Kolonları zorunlu hale getir (isteğe bağlı)
ALTER TABLE public.users
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN mfa_enabled SET NOT NULL;

-- refresh token kasası (hash’li tut)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refreshtokens_user ON public.refresh_tokens(user_id);

-- (opsiyonel) şifre sıfırlama ve e-posta doğrulama
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--DB alanları (MFA için)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret  TEXT,
  ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];
 

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

  ALTER TABLE public.users
  DROP COLUMN IF EXISTS password; 

INSERT INTO users (username, email) VALUES ('sumi', 'sumi@example.com') RETURNING id;

SELECT id, email, mfa_enabled, mfa_secret
FROM public.users
WHERE email = 'sumi@example.com';

SELECT id, email FROM public.users
WHERE email = 'sumi@example.com';

SELECT id, name FROM public.projects WHERE id = 2;

INSERT INTO public.clients (name)
VALUES ('Internal')
ON CONFLICT (name) DO UPDATE
SET name = EXCLUDED.name
RETURNING id;

INSERT INTO public.projects (client_id, name, description, manager_id)
VALUES (
  (SELECT id FROM public.clients WHERE name='Internal'),
  'Demo Project',
  'Realtime test',
  (SELECT id FROM public.users WHERE email='sumi@example.com')
)
RETURNING id;

UPDATE public.projects p
SET manager_id = u.id
FROM public.users u
WHERE p.name = 'Demo Project'
  AND u.email = 'sumi@example.com'
RETURNING p.*;              

--burada manager_email = sumi@example.com, client_name = Internal görüyorsan her şey yolunda demektir.
SELECT p.id, p.name, u.email AS manager_email, c.name AS client_name
FROM public.projects p
JOIN public.users u   ON u.id = p.manager_id
JOIN public.clients c ON c.id = p.client_id
WHERE p.name = 'Demo Project';

--Projeye “owner” üye ekle
INSERT INTO public.project_members (project_id, user_id, role)
SELECT p.id, u.id, 'owner'
FROM public.projects p
JOIN public.users u ON u.email='sumi@example.com'
WHERE p.name='Demo Project'
ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role
RETURNING *;

--Etiket oluştur (General)
INSERT INTO public.labels (project_id, name, color_hex)
SELECT p.id, 'General', '#808080'
FROM public.projects p
WHERE p.name='Demo Project'
ON CONFLICT (project_id, name) DO UPDATE SET color_hex = EXCLUDED.color_hex
RETURNING *;

--Görev oluştur
INSERT INTO public.tasks (project_id, title, status)
SELECT p.id, 'İlk görev', 'todo'
FROM public.projects p
WHERE p.name='Demo Project'
RETURNING *;

--Göreve atama yap
INSERT INTO public.task_assignees (task_id, user_id)
SELECT t.id, u.id
FROM public.tasks t
JOIN public.projects p ON p.id = t.project_id
JOIN public.users u    ON u.email='sumi@example.com'
WHERE p.name='Demo Project' AND t.title='İlk görev'
ON CONFLICT (task_id, user_id) DO UPDATE SET assigned_at = NOW()
RETURNING *;

--Göreve etiket ekle
INSERT INTO public.task_labels (task_id, label_id)
SELECT t.id, l.id
FROM public.tasks  t
JOIN public.projects p ON p.id = t.project_id
JOIN public.labels  l ON l.project_id = p.id AND l.name='General'
WHERE p.name='Demo Project' AND t.title='İlk görev'
ON CONFLICT DO NOTHING
RETURNING *;

--Projedeki görevleri, atanan kullanıcıları ve etiketleri listele
SELECT
  p.name            AS project,
  t.title           AS task,
  t.status,
  u.username        AS assigned_to,
  string_agg(DISTINCT l.name, ', ') AS labels
FROM public.projects p
JOIN public.tasks t         ON t.project_id = p.id
LEFT JOIN public.task_assignees ta ON ta.task_id = t.id
LEFT JOIN public.users u           ON u.id = ta.user_id
LEFT JOIN public.task_labels tl    ON tl.task_id = t.id
LEFT JOIN public.labels l          ON l.id = tl.label_id
WHERE p.name='Demo Project'
GROUP BY p.name, t.title, t.status, u.username
ORDER BY t.title;



--tablo ve kolon doğrulama sorgusu
WITH expected(table_name, column_name) AS (
  VALUES
  -- clients
  ('clients','id'), ('clients','name'), ('clients','contact_name'),
  ('clients','contact_email'), ('clients','created_at'), ('clients','updated_at'),

  -- labels
  ('labels','id'), ('labels','project_id'), ('labels','name'),
  ('labels','color_hex'), ('labels','created_at'),

  -- tasks (koda göre kullanılanlar)
  ('tasks','id'), ('tasks','title'), ('tasks','status'),
  ('tasks','created_at'), ('tasks','updated_at'),

  -- task_assignees
  ('task_assignees','task_id'), ('task_assignees','user_id'), ('task_assignees','assigned_at'),

  -- task_labels
  ('task_labels','task_id'), ('task_labels','label_id'),

  -- users (koda göre kullanılanlar)
  ('users','id'), ('users','username'), ('users','email'), ('users','title')

  -- İstersen projects / project_members için de detay ekleyebilirsin
)
SELECT e.table_name, e.column_name,
       CASE WHEN c.column_name IS NULL THEN 'MISSING' ELSE 'OK' END AS status
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name  = e.table_name
 AND c.column_name = e.column_name
ORDER BY e.table_name, e.column_name;

SELECT * FROM users WHERE email = 'veli@mirox.com';

ALTER TABLE users
ADD COLUMN phone VARCHAR(20);

SELECT * FROM users WHERE email = 'sumeyyee@mirox.com'

SELECT id, username, email, role, title, phone, is_active FROM users ORDER BY id DESC;*/

SELECT id, email FROM public.users WHERE email ILIKE '%gmail.com';

DELETE FROM users WHERE email = 's7m36635901l@gmail.com';