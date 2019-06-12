const async = require('async');
const colors = require('ansi-colors');
const flog = require('fancy-log');
const path = require('path');

function log(...msg) {
    msg.unshift('gulp-sftp:');
    flog.apply(console, msg);
}

function isDirectory(entry) {
    // Save one network call for 'stat' by checking the 'd' flag in longname:
    // drwxr--r-- 1 bar bar 718 Dec 8 2009 foo
    return entry.longname.startsWith('d');
}

/*
 * Delete contents of a directory on an SFTP server
 * @param {SFTPStream} sftp
 * @param {string} dirPath Remote directory
 * @param {(error) -> ()} callback Callback
 */
function clearDirectory(sftp, dirPath, callback) {
    function deleteEntry(entry, callback) {
        var entryPath = path.posix.join(dirPath, entry.filename);

        if (isDirectory(entry)) {
            clearDirectory(sftp, entryPath, () => {
                log(colors.green('Deleting remote directory'), entryPath);
                sftp.rmdir(entryPath, callback);
            });
        } else {
            log(colors.green('Deleting remote file'), entryPath);
            sftp.unlink(entryPath, callback);
        }
    }

    sftp.readdir(dirPath, (err, entries) => {
        async.map(entries, deleteEntry, callback);
    });
}
/**
 * Clean the top level directory once all subdirectory and files are removed
 * @param {SFTPStream} sftp
 * @param {string} dirPath remote directory
 * @param {(error)=>{}} callback Callback
 */
function clearAllDirectory(sftp,dirPath,callback){
    function deleteTopLevelDirectory(){
        //Remove the top level directory and call the caller callback
        sftp.rmdir(dirPath, callback);
    }
    clearDirectory(sftp,dirPath,deleteTopLevelDirectory)
}

module.exports.clearDirectory = clearAllDirectory;