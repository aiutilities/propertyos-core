INSERT INTO permissions (
  id,
  permission_key,
  description
)
SELECT
  gen_random_uuid(),
  'report.read',
  'Allows viewing operational reports'
WHERE NOT EXISTS (
  SELECT 1
  FROM permissions
  WHERE permission_key = 'report.read'
);

INSERT INTO role_permissions (
  id,
  role_id,
  permission_id
)
SELECT
  gen_random_uuid(),
  role.id,
  permission.id
FROM roles role
INNER JOIN permissions permission
  ON permission.permission_key = 'report.read'
WHERE role.name = 'Administrator'
  AND role.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM role_permissions role_permission
    WHERE role_permission.role_id = role.id
      AND role_permission.permission_id = permission.id
  );
