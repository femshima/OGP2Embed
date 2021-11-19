import fs from "fs";
import path from "path";
import { ModelCtor, Sequelize } from "sequelize-typescript";
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.json')[env];


const uri: string | undefined = config.use_env_variable && process.env[config.use_env_variable];
const sequelize = uri ?
    new Sequelize(uri, config) :
    new Sequelize(config);



import SentMessages from "./sentmessages";
export {
    SentMessages
}

sequelize.addModels([
    SentMessages
]);

export default sequelize;

