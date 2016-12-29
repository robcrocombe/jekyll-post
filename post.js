#!/usr/bin/env node

const program = require('commander');
const rl = require('readline-sync');
const matter = require('gray-matter');
const moment = require('moment');
const fs = require('fs-extra');
const dir = require('path');

const DRAFT_DIR = dir.join(process.cwd(), '_drafts');
const POST_DIR = dir.join(process.cwd(), '_posts');

program
  .version('1.0.0')
  .usage('<command> "post name"')
  .option('d, draft <name>', 'create a draft post')
  .option('p, publish [name]', 'publish all drafts, or a single draft')
  .option('u, unpublish <name>', 'unpublish a post')
  .parse(process.argv);

checkJekyllExists();

if (program.draft) {
  createDraft(program.draft);
} else if (program.publish) {
  publishPost(program.publish);
} else if (program.unpublish) {
  unpublishPost(program.unpublish);
}

function createDraft(postName) {
  const fileName = parseName(postName);
  const target = dir.join(DRAFT_DIR, `${fileName}.md`);

  const frontMatter = {
    layout: 'post',
    title: postName,
    slug: fileName
  };

  if (fileExists(target)) {
    if (rl.keyInYN(`Draft '${target}' already exists. Overwrite?`)) {
      writeFileThenExit(target, fileName, frontMatter);
    } else {
      exit(0);
    }
  } else {
    writeFileThenExit(target, fileName, frontMatter);
  }
}

function publishPost(postName) {
  if (postName === true) {
    publishAllPosts();
  } else {
    publishSinglePost(`${parseName(postName)}.md`, true);
  }
}

function publishAllPosts() {
  fs.readdir(DRAFT_DIR, (err, files) => {
    if (err) {
      console.log(err);
      exit(1);
    } else {
      for (const file of files) {
        publishSinglePost(file, false);
      }
      exit(0);
    }
  });
}

function publishSinglePost(fileName, exitOnWrite) {
  const source = dir.join(DRAFT_DIR, fileName);

  if (fileExists(source)) {
    const post = matter.read(source);
    const now = moment();
    post.data.date = getDateTime(now);

    const publishName = `${getDateOnly(now)}-${fileName}`;
    const target = dir.join(POST_DIR, publishName);

    if (fileExists(target)) {
      if (rl.keyInYN(`Post '${target}' already exists. Overwrite?`)) {
        deleteFile(source);
        if (exitOnWrite) {
          writeFileThenExit(target, publishName, post.data, post.content);
        } else {
          writeFile(target, publishName, post.data, post.content);
        }
      } else if (exitOnWrite) {
        exit(0);
      }
    } else if (exitOnWrite) {
      deleteFile(source);
      writeFileThenExit(target, publishName, post.data, post.content);
    } else {
      deleteFile(source);
      writeFile(target, publishName, post.data, post.content);
    }
  } else {
    console.log(`Draft '${source}' not found.`);
    exit(1);
  }
}

function unpublishPost(postName) {
  const fileName = `${parseName(postName)}.md`;

  fs.readdir(POST_DIR, (err, files) => {
    if (err) {
      console.log(err);
      exit(1);
    } else {
      for (const file of files) {
        if (file.substring(11) === fileName) {
          const source = dir.join(POST_DIR, file);
          const target = dir.join(DRAFT_DIR, fileName);

          if (fileExists(target)) {
            if (rl.keyInYN(`Draft '${target}' already exists. Overwrite?`)) {
              moveFileThenExit(source, target, fileName);
              return;
            }
            exit(0);
          } else {
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
    .replace(/['".,/#!?$%^&*;:{}=`~()]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-');
}

function getDateTime(date) {
  return date.format('YYYY-MM-DD HH:mm:ssZ');
}

function getDateOnly(date) {
  return date.format('YYYY-MM-DD');
}

function checkJekyllExists() {
  const draftDirExist = fileExists(DRAFT_DIR);
  const postDirExist = fileExists(POST_DIR);

  if (!draftDirExist && !postDirExist) {
    console.log('Draft and post folders not found. Are you in a Jekyll project?');
    exit(1);
  } else if (!draftDirExist) {
    console.log('Draft folder not found. Are you in a Jekyll project?');
    exit(1);
  } else if (!postDirExist) {
    console.log('Post folder not found. Are you in a Jekyll project?');
    exit(1);
  }
}

function fileExists(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch (err) {
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
  } catch (err) {
    console.log(err);
    exit(1);
  }
}

function writeFile(path, name, frontMatter, content = '') {
  try {
    fs.writeFileSync(path, matter.stringify(content, frontMatter));
    const type = program.draft ? 'Draft' : 'Post';

    if (name.endsWith('.md')) {
      console.log(`${type} '${name}' created.`);
    } else {
      console.log(`${type} '${name}.md' created.`);
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function writeFileThenExit(path, name, frontMatter, content) {
  if (writeFile(path, name, frontMatter, content)) {
    exit(0);
  } else {
    exit(1);
  }
}

function exit(status) {
  process.exit(status);
}
