#!/usr/bin/env node
"use strict";

const DRAFT_DIR = process.cwd() + '/_drafts';
const POST_DIR = process.cwd() + '/_posts';
var program = require('commander');
var rl = require('readline-sync');
var matter = require('gray-matter');
var moment = require('moment');
var fs = require('fs');

program
  .version('1.0.0')
  .usage('post <command> "post_name"')
  .option('draft <post_name>', 'create a draft post')
  .option('publish [post_name]', 'publish all drafts, or a single draft')
  .parse(process.argv);

if (program.publish) {
  publishPost(program.publish);
}
else if (program.draft) {
  createDraft(program.draft);
}

function parseName(val) {
  return val
    .toLowerCase()
    .replace(/[^A-Za-z0-9_-]+/g, '-');
}

function createDraft(postName) {
  var fileName = parseName(postName);
  var path = `${DRAFT_DIR}/${fileName}.md`;

  var frontMatter = {
    layout: 'post',
    title: postName,
    slug: fileName
  };

  if (fileExists(path)) {
    if (rl.keyInYN(`File '${path}' already exists. Overwrite?`)) {
      writeFileThenExit(path, fileName, frontMatter);
    }
    else {
      exit(0);
    }
  }
  else {
    writeFileThenExit(path, fileName, frontMatter);
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
  var path = `${DRAFT_DIR}/${fileName}`;

  if (fileExists(path)) {
    var post = matter.read(path);
    var now = moment();
    post.data.date = getDateTime(now);

    var publishName = `${getDateOnly(now)}-${fileName}`;
    var publishPath = `${POST_DIR}/${publishName}`;

    if (fileExists(publishPath)) {
      if (rl.keyInYN(`File '${publishPath}' already exists. Overwrite?`)) {
        if (exitOnWrite) {
          writeFileThenExit(publishPath, publishName, post.data, post.content);
        }
        else {
          writeFile(publishPath, publishName, post.data, post.content);
        }
      }
      else if (exitOnWrite) {
        exit(0);
      }
    }
    else if (exitOnWrite) {
      writeFileThenExit(publishPath, publishName, post.data, post.content);
    }
    else {
      writeFile(publishPath, publishName, post.data, post.content);
    }
  }
  else {
    console.log(`File '${path}' doesn't exist.`);
    exit(1);
  }
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

function writeFile(path, name, frontMatter, content) {
  content = content || '';

  try {
    fs.writeFileSync(path, matter.stringify(content, frontMatter));
    if (name.endsWith('.md')) {
      console.log(`Post '${name}' created.`);
    }
    else {
      console.log(`Post '${name}.md' created.`);
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
