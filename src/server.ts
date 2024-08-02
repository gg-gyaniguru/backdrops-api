import express from 'express';
import session from 'express-session';
import {createServer} from 'http';
import {Server} from "socket.io";
import fileUpload from 'express-fileupload';
import connection from './database/connection.ts';
import user from './routes/user.ts';
import drop from './routes/drop.ts';
import comment from "./routes/comment.ts";
import cors from 'cors';
import {secret} from "./middlewares/route.ts";

const server = express();
const router = express.Router();
const httpServer = createServer(server);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:6090',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
});

const PORT = process.env.PORT || 9060;

server.use(cors(
    {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }
));
server.options('*', cors());
server.use(express.json());
server.use(express.urlencoded({extended: true}));
server.use(fileUpload());

server.use(session({
    secret: process.env.SECRET_KEY as string,
    resave: false,
    saveUninitialized: true,
}));

(async () => {

    await connection();

    server.use(secret);

    router.get('/', (request, response) => {
        return response.status(200).json({message: 'server is running'});
    });

    router.use('/user', user);
    router.use('/drop', drop);
    router.use('/comment', comment);
    router.use('/static', express.static('public'));

    server.use('/api', router);

    server.all('*', (request, response) => {
        return response.status(404).json({message: 'route not found'});
    });

    httpServer.listen(PORT);
})();