'use strict';

const readlinePromises = require('node:readline/promises');
const { level, show, log, logRelation } = require('./utils/functions.js');
const { logHelp, serialize, deserialize } = require('./utils/fileSystem.js');
const { Tree } = require('./classes/Tree.js');

const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

const state = { level: 'common' };

const commands = {

  common: {

    async about() {
      await logHelp('about');
      rl.prompt();
    },

    async create() {
      const name = await rl.question('New tree name: ');
      const rootName = await rl.question('Root full name: ');
      const rootBirth = await rl.question('Root birth year [or skip]: ');
      state.tree = Tree.create(name, rootName, rootBirth);
      state.level = level.down(rl, state);
    },

    async exit() {
      rl.close();
    },

    async help() {
      await logHelp(state.level);
      rl.prompt();
    },

    async open() {
      const fileName = await rl.question('File Name: ');
      await deserialize(fileName).then((tree) => {
        state.file = fileName;
        state.tree = Tree.parse(tree);
        state.level = level.down(rl, state);
      }).catch((err) => log.error(err.message));
      rl.prompt();
    }

  },

  tree: {

    async add() {
      const name = await rl.question('New member full name: ');
      const birth = await rl.question('Member birth year [or skip]: ');
      const tree = state.tree;
      tree.addMember(name, birth);
      rl.prompt();
    },

    async exit() {
      const res = await rl.question('Do you want to save tree before leaving? [y/n]: ');
      if (res.trim() !== 'n') {
        const tree = state.tree;
        if (!state.file) state.file = await rl.question('New file name: ');
        await serialize(state.file, tree);
        log.success('Successfully saved!');
      }
      state.level = level.up(rl, state);
    },

    async help() {
      await logHelp(state.level);
      rl.prompt();
    },

    async member() {
      const name = await rl.question('Choose member [full name]: ');
      const tree = state.tree;
      try {
        state.member = tree.getMember(name);
        state.level = level.down(rl, state);
      } catch (err) {
        log.error(err.message);
      }
      rl.prompt();
    },

    async remove() {
      const name = await rl.question('Remove member [full name]: ');
      const tree = state.tree;
      await tree.removeMember(name).catch((err) => log.error(err.message));
      rl.prompt();
    },

    async rename() {
      const name = await rl.question('New name of tree: ');
      const tree = state.tree;
      tree.rename(name);
      rl.prompt();
    },

    async root() {
      const name = await rl.question('Change root [full name]: ');
      const tree = state.tree;
      tree.changeRoot(name);
      rl.prompt();
    },

    async save() {
      const tree = state.tree;
      if (!state.file) state.file = await rl.question('New file name: ');
      await serialize(state.file, tree);
      log.success('Successfully saved!');
      rl.prompt();
    },

    async show(key) {
      const tree = state.tree;
      await show.tree(key, tree).catch((err) => log.error(err.message));
      rl.prompt();
    },

  },

  member: {

    async contact() {
      const type = await rl.question('Contact type: ');
      const contact = await rl.question('Contact: ');
      const member = state.member;
      member.addContact(type, contact);
      rl.prompt();
    },

    async describe() {
      const text = await rl.question('Description: ');
      const member = state.member;
      member.describe(text);
      rl.prompt();
    },

    async event() {
      const year = await rl.question('Event year: ');
      const event = await rl.question('Description: ');
      const member = state.member;
      member.addEvent(year, event);
      rl.prompt();
    },

    async exit() {
      state.level = level.up(rl, state);
    },

    async help() {
      await logHelp(state.level);
      rl.prompt();
    },

    async relate() {
      const name = await rl.question('Relative full name: ');
      const tree = state.tree;
      try {
        const relative = tree.getMember(name);
        const type = logRelation();
        const to = await rl.question(`Relation => ${name} to current person [num]: `);
        const from = await rl.question(`Relation => current person to ${name} [num]: `);
        state.member.relate(type(to), relative);
        relative.relate(type(from), state.member);
      } catch (err) {
        log.error(err.message);
      }
      rl.prompt();
    },

    async show(key) {
      const member = state.member;
      await show.member(key, member).catch((err) => log.error(err.message));
      rl.prompt();
    },

    async unrelate() {
      const name = await rl.question('Unrelate person [full name]: ');
      const tree = state.tree;
      const member = state.member;
      try {
        const relative = tree.getMember(name);
        tree.unrelatePair(member, relative);
      } catch (err) {
        log.error(err.message);
      }
      rl.prompt();
    }

  },

};

const start = () => {
  console.clear();
  log.info('Hello! Welcome to Family Tree app.');
  log.info('Type `help` to see commands\n');
};

const activate = (line) => {
  const [ name, key ] = line.split(' ');
  const current = commands[state.level];
  const command = current[name.trim()];
  if (!command) throw new Error('Invalid command');
  key ? command(key.trim()) : command();
};

module.exports = { rl, log, start, activate };
