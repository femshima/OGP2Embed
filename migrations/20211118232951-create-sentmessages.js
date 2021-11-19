'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sentmessages', {
      guildId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      channelId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      messageId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      originMessageId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      originUserId: {
        allowNull: false,
        type: Sequelize.STRING
      },
      originCreatedAt: {
        type: Sequelize.DATE
      },
      originUpdatedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sentmessages');
  }
};