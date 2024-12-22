import {Router} from 'express';
import {Room} from "../models/room.model";

const router = Router();

router.post('/rooms/private', async (req, res) => {
    const {user1Id, user2Id} = req.body;
    const room = Room.createPrivateRoom(user1Id, user2Id);
    res.json(room);
});

router.post('/rooms/event', async (req, res) => {
    const {eventId} = req.body;
    const room = Room.createEventRoom(eventId);
    res.json(room);
});

router.post('/rooms/jam', async (req, res) => {
    const {jamId} = req.body;
    const room = Room.createJamRoom(jamId);
    res.json(room);
});

export const roomRoutes = router;