-- Insert statuses by default
INSERT INTO statuses (id, name, value) VALUES (1,'PENDING', 'pending') ON CONFLICT (id) DO NOTHING;
INSERT INTO statuses (id, name, value) VALUES (2,'ONGOING', 'ongoing') ON CONFLICT (id) DO NOTHING;
INSERT INTO statuses (id, name, value) VALUES (3, 'COMPLETED', 'completed') ON CONFLICT (id) DO NOTHING;
INSERT INTO statuses (id, name, value) VALUES (4,'BLOCKED', 'blocked') ON CONFLICT (id) DO NOTHING;
INSERT INTO statuses (id, name, value) VALUES (5, 'CANCELLED', 'cancelled') ON CONFLICT (id) DO NOTHING;

-- Insert roles by default
INSERT INTO roles (id, name, value) VALUES (1, 'Admin', 'admin') ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, name, value) VALUES (2, 'USER', 'user') ON CONFLICT (id) DO NOTHING;

-- Insert projects by default
INSERT INTO projects (name, description, user_id, created_at, updated_at)
VALUES ('Default Project', 'Dummy project by default', 1,current_timestamp, current_timestamp)
ON CONFLICT (name) DO NOTHING;
