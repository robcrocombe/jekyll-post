#!/usr/bin/env node
"use strict";

const DRAFT_DIR = process.cwd() + '/_drafts';
const POST_DIR = process.cwd() + '/_posts';
var program = require('commander');
var rl = require('readline-sync');
var matter = require('gray-matter');
var moment = require('moment');
var fs = require('fs-extra');

program
  .version('1.0.0')
  .usage('post <command> "name"')
  .option('d, draft <name>', 'create a draft post')
  .option('p, publish [name]', 'publish all drafts, or a single draft')
  .option('u, unpublish <name>', 'unpublish a post')
  .parse(process.argv);

if (program.draft) {
  createDraft(program.draft);
}
else if (program.publish) {
  publishPost(program.publish);
}
else if (program.unpublish) {
  unpublishPost(program.unpublish);
}

function createDraft(postName) {
  var fileName = parseName(postName);
  var target = `${DRAFT_DIR}/${fileName}.md`;

  var frontMatter = {
    layout: 'post',
    title: postName,
    slug: fileName
  };

  if (fileExists(target)) {
    if (rl.keyInYN(`Draft '${target}' already exists. Overwrite?`)) {
      writeFileThenExit(target, fileName, frontMatter);
    }
    else {
      exit(0);
    }
  }
  else {
    writeFileThenExit(target, fileName, frontMatter);
  }
}

function publishPost(postName) {
  if (postName == true) {
    publishAllPosts();
  }
  else {
    publishSinglePost(`${parseName(postName)}.md`, true);
  }
}

function publishAllPosts() {
  fs.readdir(DRAFT_DIR, (err, files) => {
    if (err) {
      console.log(err);
      exit(1);
    }
    else {
      for (var file of files) {
        publishSinglePost(file, false);
      }
      exit(0);
    }
  });
}

function publishSinglePost(fileName, exitOnWrite) {
  var source = `${DRAFT_DIR}/${fileName}`;

  if (fileExists(source)) {
    var post = matter.read(source);
    var now = moment();
    post.data.date = getDateTime(now);

    var publishName = `${getDateOnly(now)}-${fileName}`;
    var target = `${POST_DIR}/${publishName}`;

    if (fileExists(target)) {
      if (rl.keyInYN(`Post '${target}' already exists. Overwrite?`)) {
        deleteFile(source);
        if (exitOnWrite) {
          writeFileThenExit(target, publishName, post.data, post.content);
        }
        else {
          writeFile(target, publishName, post.data, post.content);
        }
      }
      else if (exitOnWrite) {
        exit(0);
      }
    }
    else if (exitOnWrite) {
      deleteFile(source);
      writeFileThenExit(target, publishName, post.data, post.content);
    }
    else {
      deleteFile(source);
      writeFile(target, publishName, post.data, post.content);
    }
  }
  else {
    console.log(`Draft '${source}' not found.`);
    exit(1);
  }
}

function unpublishPost(postName) {
  var fileName = `${parseName(postName)}.md`;

  fs.readdir(POST_DIR, (err, files) => {
    if (err) {
      console.log(err);
      exit(1);
    }
    else {
      for (var file of files) {
        if (file.substring(11) === fileName) {
          var source = `${POST_DIR}/${file}`
          var target = `${DRAFT_DIR}/${fileName}`;

          if (fileExists(target)) {
            if (rl.keyInYN(`Draft '${target}' already exists. Overwrite?`)) {
              moveFileThenExit(source, target, fileName);
              return;
            }
            else {
              exit(0);
            }
          }
          else {
            moveFileThenExit(source, target, fileName);
            return;
          }
        }
      }
      console.log(`Post ending with '${fileName}' not found.`);
      exit(1);
    }
  });
}

function parseName(val) {
  return val
    .toLowerCase()
    .replace(/['".,\/#!?$%\^&\*;:{}=\`~()]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-');
}

function getDateTime(date) {
  return date.format('YYYY-MM-DD HH:mm:ssZ');
}

function getDateOnly(date) {
  return date.format('YYYY-MM-DD');
}

function fileExists(path) {
  try {
    fs.accessSync(path);
    return true;
  }
  catch(err) {
    return false;
  }
}

function moveFileThenExit(source, target, fileName) {
  fs.move(source, target, { clobber: true }, (err) => {
    if (err) {
      console.log(err);
      exit(1);
    }
    console.log(`Post '${fileName}' moved to drafts.`);
    exit(0);
  });
}

function deleteFile(path) {
  try {
    fs.removeSync(path);
  }
  catch(err) {
    console.log(err);
    exit(1);
  }
}

function writeFile(path, name, frontMatter, content) {
  content = content || '';

  try {
    fs.writeFileSync(path, matter.stringify(content, frontMatter));
    var type = program.draft ? 'Draft' : 'Post';

    if (name.endsWith('.md')) {
      console.log(`${type} '${name}' created.`);
    }
    else {
      console.log(`${type} '${name}.md' created.`);
    }
    return true;
  }
  catch(err) {
    console.log(err);
    return false;
  }
}

function writeFileThenExit(path, name, frontMatter, content) {
  if (writeFile(path, name, frontMatter, content)) {
    exit(0);
  }
  else {
    exit(1);
  }
}

function exit(status) {
  process.exit(status);
}
