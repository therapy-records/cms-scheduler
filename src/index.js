require('dotenv').config();
import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import morgan from 'morgan';
import scheduler from './scheduler';
import throwConsole from './helpers/console';

const port = process.env.PORT || 2000;
const router = express.Router();
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST');
  methodOverride('X-HTTP-Method-Override');
  app.use(bodyParser.json({ limit: 1500 * 1500 * 20, type: 'application/json' }));
  bodyParser.urlencoded({ extended: true });
  next();
}); 

app.use(morgan('dev'));

app.listen(port);

throwConsole('🚀  Server running on port ' + port);

scheduler();
