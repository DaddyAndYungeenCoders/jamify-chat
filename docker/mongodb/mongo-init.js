print('Start #######################');

// db = db.getSiblingDB('chat-db');

db.createUser({
    user: "root",
    pwd: "password",
    roles: [{ role: "readWrite", db: "chat-db" }]
});

// db.createCollection("messages");

print('END #######################');