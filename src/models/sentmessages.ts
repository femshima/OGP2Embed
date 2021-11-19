import { Table, Column, Model, HasMany } from 'sequelize-typescript'

@Table
export default class SentMessages extends Model {
    @Column({ primaryKey: true })
    guildId!: string;
    @Column({ primaryKey: true })
    channelId!: string;
    @Column({ primaryKey: true })
    messageId!: string;
    @Column
    originMessageId!: string;
    @Column
    originUserId!: string;
    @Column
    originCreatedAt!: Date;
    @Column
    originUpdatedAt?: Date;
}