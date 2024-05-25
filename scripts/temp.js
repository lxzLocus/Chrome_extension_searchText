/**** MODULES ****/
var TextDataPath = "../content/textData";

/**** MAIN ****/
const updateContextMenus = async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
      id: "string-search",
      title: "文字列検索",
      contexts: ["selection"]
  });
};

chrome.runtime.onInstalled.addListener(updateContextMenus);
chrome.runtime.onStartup.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const selectStrings = info.selectionText;

    try {
        message = isStringInDirectoryFiles(selectStrings);
        console.log(`文字列 "${selectStrings}" はファイルに${message ? "含まれています" : "含まれていません"}`);
    } catch (error) {
        console.log(`${selectStrings}`)
        console.error(`エラーが発生しました: ${error.message}`);
    }
  
});

/**** FUNCTIONS ****/
// ファイルを読み取る関数
const readFile = (filename) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.getPackageDirectoryEntry((root) => {
            root.getFile(filename, {}, (fileEntry) => {
                fileEntry.file((file) => {
                    const reader = new FileReader();
                    reader.onloadend = (e) => {
                        resolve(e.target.result);
                    };
                    reader.readAsText(file);
                }, (error) => {
                    reject(error);
                });
            }, (error) => {
                reject(error);
            });
        });
    });
};

// 指定されたディレクトリ内のすべてのファイルを取得する関数
const getFilesInDirectory = async (dir, extension) => {
    return new Promise((resolve, reject) => {
        chrome.runtime.getPackageDirectoryEntry((root) => {
            const reader = root.createReader();
            const files = [];

            const readEntries = () => {
                reader.readEntries((entries) => {
                    if (entries.length === 0) {
                        resolve(files);
                    } else {
                        entries.forEach((entry) => {
                            if (entry.isDirectory) {
                                // ディレクトリの場合は再帰的に呼び出し
                                getFilesInDirectory(entry.fullPath, extension).then((subFiles) => {
                                    files.push(...subFiles);
                                    readEntries();
                                }).catch(reject);
                            } else if (entry.name.endsWith(extension)) {
                                files.push(entry.fullPath);
                                readEntries();
                            }
                        });
                    }
                }, (error) => {
                    reject(error);
                });
            };

            readEntries();
        });
    });
};


// ファイル内に指定された文字列が存在するかどうかを確認する関数
const isStringInFile = async (filename, searchString) => {
    try {
        const content = await readFile(filename);
        return content.includes(searchString);
    } catch (error) {
        console.error("Error reading file:", error);
        throw error;
    }
};

// 文字列がディレクトリ内のいずれかのファイルに存在するかどうかを確認する関数
const isStringInDirectoryFiles = async (selectStrings) => {
    try {
        const files = await getFilesInDirectory(TextDataPath, '.txt');
        for (const file of files) {
            if (await isStringInFile(file, selectStrings)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error during directory search:", error);
        throw error;
    }
};