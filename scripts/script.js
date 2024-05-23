const fs = require('fs').promises;
const path = require('path');
const envFilePath = 'env.json'

// env.jsonの読み込み
const loadEnv = async () => {
  try {
    const data = await fs.readFile(envFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read env.json:', err);
    throw err;
  }
};

/**
 * 指定されたディレクトリ内のすべてのファイルを取得
 * @param {string} dirPath - ディレクトリのパス
 * @returns {Promise<string[]>} - ファイルパスの配列
 */
const getFilesInDirectory = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    return files.map(file => path.join(dirPath, file));
  } catch (err) {
    console.error('Failed to read directory:', err);
    throw err;
  }
};

/**
 * 指定されたファイルに文字列が含まれているかを判定する関数
 * @param {string} filePath - 検索対象のファイルパス
 * @param {string} searchString - 検索する文字列
 * @returns {Promise<boolean>} - 文字列が含まれている場合はtrue、含まれていない場合はfalse
 */
const isStringInFile = async (filePath, searchString) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const regex = new RegExp(searchString, 'i'); // 大文字小文字を無視する正規表現
    return regex.test(data);
  } catch (err) {
    console.error(`Failed to read file ${filePath}:`, err);
    throw err;
  }
};

/**
 * 指定されたディレクトリ内の全ファイルを探索して文字列を検索する関数
 * @param {string} dirPath - 検索対象のディレクトリパス
 * @param {string} searchString - 検索する文字列
 * @returns {Promise<boolean>} - 文字列が含まれているファイルが1つでもあればtrue、なければfalse
 */
const isStringInDirectoryFiles = async (dirPath, searchString) => {
  try {
    const files = await getFilesInDirectory(dirPath);
    for (const file of files) {
      if (await isStringInFile(file, searchString)) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Error during directory search:', err);
    throw err;
  }
};

const updateContextMenus = async () => {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "next-String-search",
    title: "文字列検索",
    contexts: ["all"]
  });
};

chrome.runtime.onInstalled.addListener(updateContextMenus);
chrome.runtime.onStartup.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener(async (info) => {
    const selectStrings = info.selectionText;
    const message = null;

    var opt = {
        type: "basic",
        title: "Result",
        message: message,
        iconUrl: "content/icon.jpg"
    }

    try {
        const env = await loadEnv();
        const dirPath = env.TEXT_DIRECTORY_PATH;
        message = await isStringInDirectoryFiles(dirPath, selectStrings);
        console.log(`文字列 "${selectStrings}" はファイルに${result ? '含まれています' : '含まれていません'}`);

        await chrome.notifications.create(id, opt);
    } catch (error) {
        console.error(`エラーが発生しました: ${error.message}`);
    }
});
