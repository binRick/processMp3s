#!/usr/bin/env node

var _ = require('underscore'),
    c = require('chalk'),
    trim = require('trim'),
    child = require('child_process'),
    stripAnsi = require('strip-ansi'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    pj = require('prettyjson'),
    program = require('commander');


var mp3s = [];
var taskIterator = function(item, cb) {
    item(function(e, o) {
        cb(null, {
            a: typeof(item),
            o: o,
        });
    });
};

process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        //        console.log(typeof(chunk));
        var mp3s = _.toArray(stripAnsi(chunk.toString()).split('\n')).filter(function(s) {
            return s.length > 0;
        });
        program
            .version('0.0.1')
            .option('-i, --image [image]', 'Image', 'image')
            .option('-l, --limit [limit]', 'Parallel Limit', 'limit')
            .option('-m, --mode [limit]', 'Mode', 'mode')
            .option('-e, --extension [limit]', 'Extension', 'extension')
            .option('-d, --debug', 'Debug', 'debug')
            .option('-t, --titlefunction [titlefunction]', 'Title Function', 'titlefunction')
            .parse(process.argv);
        var tasks = [];
        if (program.debug) {
            console.log(program);
            process.exit();
        }
        _.each(mp3s, function(mp3) {
            var m = path.parse(mp3);
            var X = 1,
                TITLE = 2,
                DESC = 3;
            if (program.titlefunction) {

                var fn = new Function('file', program.titlefunction);
                var tt = fn(mp3);
                console.log(program.titlefunction);
                console.log(fn, tt);
                var TITLE = tt;
            } else {
                                TITLE = m.name.split('_2')[0];
            }
            TITLE = TITLE.replace(/_/g, ' ');
            var DATE = m.name.split('_2')[1].split('.');
            var D = {
                Y: '2' + DATE[0],
                M: DATE[1],
                D: DATE[2]
            };
            var l = m.name.split('.');
            var GUEST = l[l.length - 1];
            GUEST = GUEST.replace(/_/g, ' ');

            var Filer = {
                Date: D,
                Guest: GUEST,
                Title: TITLE,
                File: mp3,

            };
            var d = Filer.Date.Y + '-' + Filer.Date.M + '-' + Filer.Date.D;
            Filer.Title = d + ' ' + Filer.Title;
            Filer.Desc = Filer.Title + ' With Guest ' + Filer.Guest + ' on ' + d;
            console.log(Filer);
            process.exit();
            tasks.push(function(cb) {
                switch (program.mode) {
                    case 'processMp3s':
                        var cmd = 'ls ' + m.name + '.mkv 2>/dev/null || ffmpeg -loop 1 -r ntsc -i ' + program.image + ' -i ' + mp3 + ' -c:a copy -c:v libx264 -preset fast -threads 0 -shortest ' + m.name + '.mkv';
                        break;
                    case 'processVideos':
                        var cmd = "ls " + mp3 + " && ./yt.js " + process.env['KEY'] + " " + process.env.TOKEN + " " + mp3 + " '" + Filer.Title + "' '" + Filer.Desc + "' && mv " + mp3 + " " + mp3 + ".uploaded ; sleep 5";
                        break;
                }
                //                console.log(cmd);
                //                process.exit();
                var start = new Date().getTime();
                console.log(c.green('running command'), c.black.bgWhite(cmd));
                child.exec(cmd, function(e, stde, stdo) {
                    if (e) throw e;
                    var o = {
                        cmd: cmd,
                        time: new Date().getTime() - start,
                        out: String(stdo).split('\n'),
                        err: String(stde).split('\n'),
                    };
                    console.log(o.out, cmd, typeof(stdo), stdo.length);
                    cb(null, o);
                });
            });
        });
        async.mapLimit(tasks, parseInt(program.limit), taskIterator, function(e, Results) {
            if (e) throw e;
            console.log(pj.render(Results));
        });
    }
});
process.stdin.on('end', function() {
    //    process.stdout.write('end');
});
