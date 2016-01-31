#!/usr/bin/env node
"use strict";

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const draftDir = process.cwd() + '/_drafts';
const postDir = process.cwd() + '/_posts';
var program = require('commander');
var matter = require('gray-matter');
var fs = require('fs');
 
program
  .version('1.0.0')
  .usage('post <command> [post_name]')
  .option('draft <post_name>..<post_name>', 'create a draft post')
  .option('publish [post_name]', 'publish all drafts, or a single draft')
  .parse(process.argv);

if (program.publish) {
  var postName = program.publish;
  publishPost();
}
else if (program.draft) {
  var postName = program.draft;
  createDraft();
}

function parseName(val) {
  return val
    .toLowerCase()
    .replace(/[^A-Za-z0-9_-]+/g, '-');
}

function createDraft() {
  var fileName = parseName(postName);
  var path = `${draftDir}/${fileName}.md`;

  var frontMatter = {
    layout: 'post',
    title: postName,
    slug: fileName
  };

  var stats = fs.stat(path, (err, stats) => {
    if (err) {
      writeFile(path, frontMatter);
    }
    else {
      rl.question(`File '${fileName}.md' already exists. Overwrite? (y/n) `, (answer) => {
        if (answer.toLowerCase() !== 'y') {
          exit(0);
        }
        else {
          writeFile(path, fileName, frontMatter);
        }
      });
    }
  });
}

function publishPost() {
  if (postName == true) {
    publishAllPosts();
  }
  else {
    publishSinglePost();
  }
}

function publishAllPosts() {
  fs.readdir(draftDir, (err, files) => {
    if (err) {
      return console.log(err);
      exit(1);
    }
    else {
      for (var file in files) {

      }
    }
  });
}

function publishSinglePost() {
  var fileName = parseName(postName);
  var path = `${draftDir}/${fileName}.md`;

  var stats = fs.stat(path, (err, stats) => {
    if (err) {
      console.log(err);
      exit(1);
    }
    else {
      var post = matter.read(path);
      var now = new Date();
      post.data.date = now.toUTCString().replace(',', '');

      var publishPath = `${postDir}/${getDateOnly(now)}-${fileName}.md`;
      if (writeFile(publishPath, fileName, post.data, post.content)) {
        exit(0);
      }
      else {
        exit(1);
      }
    }
  });
}

function getDateOnly(date) {
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

function writeFile(path, name, frontMatter, content) {
  content = content || '';

  try {
    fs.writeFileSync(path, matter.stringify(content, frontMatter));
  }
  catch(err) {
    console.log(err);
    return false;
  }

  console.log(`Post '${name}.md' created.`);
  return true;
}

function exit(status) {
  rl.close();
  process.exit(status);
}
