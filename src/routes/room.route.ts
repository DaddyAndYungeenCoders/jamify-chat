import {Router} from 'express';
import {RoomService} from "../services/room.service";
import {Room} from "../models/room.model";
import logger from "../config/logger";

export const roomRoutes = (roomService: RoomService) => {
    const router = Router();

    router.get('/', async (req, res) => {
        logger.info("Rooms API");
        res.json("Rooms API");
    });

    router.post('/private', async (req, res) => {
        const {user1Id, user2Id} = req.body;
        const room: Room = await roomService.createPrivateRoom(user1Id, user2Id);
        res.json(room);
    });

    router.post('/event', async (req, res) => {
        const {eventId} = req.body;
        const room: Room = await roomService.createEventRoom(eventId);
        res.json(room);
    });

    router.post('/jam', async (req, res) => {
        const {jamId} = req.body;
        const room: Room = await roomService.createJamRoom(jamId);
        res.json(room);
    });

    return router;
}

