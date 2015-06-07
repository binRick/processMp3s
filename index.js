#!/usr/bin/env node

var _ = require('underscore'),

    trim = require('trim'),
    child = require('child_process'),
    stripAnsi = require('strip-ansi'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    pj = require('prettyjson'),
    program = require('commander');

var parallelLimit = 5;

var mp3s = [];
var taskIterator = function(item, cb) {
    item(function(e, o) {
        cb(null, {
            a: typeof(item),
            o: o,
        });
    });
    /*
        item(function(e, o) {
            if (e) throw e;
            cb(null, {
                data: o,
            });
        });*/
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
            .parse(process.argv);

        var tasks = [];
        _.each(mp3s, function(mp3) {
            var m = path.parse(mp3);
            tasks.push(function(cb) {
                var cmd = 'ls ' + m.name + '.mkv 2>/dev/null || ffmpeg -loop 1 -r ntsc -i ' + program.image + ' -i ' + mp3 + ' -c:a copy -c:v libx264 -preset fast -threads 0 -shortest ' + m.name + '.mkv';
                var start = new Date().getTime();
                var out = 'asads';
                child.exec(cmd, function(e, stde, stdo) {
                    if (e) throw e;
                    var o = {
                        cmd: cmd,
                        time: new Date().getTime() - start,
                        out: String(stdo).split('\n'),
                        err: String(stde).split('\n'),
                    };
                    console.log(o);
                    cb(null, o);

                });
            });
        });
        //        console.log(pj.render(mp3s));
        //       console.log(pj.render(tasks));
        //        console.log(tasks);
        //        async.parallelLimit(tasks, parallelLimit, function(e, Results) {
        async.mapLimit(tasks, parallelLimit, taskIterator, function(e, Results) {
            if (e) throw e;
            console.log(Results);
            /*
                        _.each(Results, function(r) {
                            var BASE = r.base;
                            fs.writeFileSync(__dirname + '/' + BASE + '.output', JSON.stringify(Results));
                        });*/

        });



        //    process.stdout.write('data: ' + chunk);
    }
});

process.stdin.on('end', function() {
    //    process.stdout.write('end');
    //
    //
    //
    //
});
