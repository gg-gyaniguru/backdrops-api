import express from 'express';
import fileUpload from 'express-fileupload';
import connection from './database/connection.ts';
import user from './routes/user.ts';
import drop from './routes/drop.ts';
import comment from "./routes/comment.ts";
import cors from 'cors';

const server = express();
const router = express.Router();
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

(async () => {
    await connection();

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

    server.listen(PORT);
})();