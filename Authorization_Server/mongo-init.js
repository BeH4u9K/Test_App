db = db.getSiblingDB('admin');

db.createUser({
  user: 'admin',
  pwd: 'admin123',
  roles: [
    {
      role: 'root',
      db: 'admin'
    }
  ]
});

db = db.getSiblingDB('auth_database');

db.createUser({
  user: 'auth_user',
  pwd: 'auth_password',
  roles: [
    {
      role: 'readWrite',
      db: 'auth_database'
    }
  ]
});

db.createCollection('users');

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });
db.users.createIndex({ provider: 1 });
db.users.createIndex({ created_at: 1 });

print("MongoDB initialized successfully");