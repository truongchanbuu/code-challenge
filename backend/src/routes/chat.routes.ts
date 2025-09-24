import { Router } from "express";
import { validate } from "../middlewares/validator.middleware";
import {
    SendMessageSchema,
    GetHistorySchema,
    ListConversationsSchema,
} from "../models/chat.model";
import { ChatController } from "../controllers/chat.controller";

export class ChatRoutes {
    public router: Router;
    private chatController: ChatController;

    constructor({ chatController }: { chatController: ChatController }) {
        this.router = Router();
        this.chatController = chatController;

        this.router.post(
            "/message",
            (req, res, next) => {
                console.log(
                    "Incoming request to /message",
                    req.method,
                    req.url
                );
                next();
            },
            validate.body(SendMessageSchema),
            this.chatController.sendMessage.bind(this.chatController)
        );

        this.router.get(
            "/history",
            validate.query(GetHistorySchema),
            this.chatController.getHistory.bind(this.chatController)
        );

        this.router.get(
            "/",
            validate.query(ListConversationsSchema),
            this.chatController.listConversations.bind(this.chatController)
        );
    }
}
