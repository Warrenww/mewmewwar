# npm-start-command

> creates a file you can double click to launch npm start

[Usage](#usage) |
[License](#license)

<img src="https://rawgit.com/fibo/os-icons8/master/Apple-50.png" width="50" height="50" />

## Usage

Assumptions:

0. You *are a* (or *work with a*) designer who want to launch a server to develop cool webapps.
1. You have [Node.js](https://nodejs.org/en/) installed.
2. Your working folder contains a [package.json](https://docs.npmjs.com/files/package.json). If there is no *package.json* yet, you can create it with `npm init -y`.
3. Your *package.json* contains a `start` script


Install command with

```bash
npm install npm-start-command --save-dev
```

Optionally, make git ignore *npm-start-command* file.

```bash
echo "npm-start-command" >> .gitignore
```

An *npm-start.command* file will be created: if you click it, your
development server will be launched.

**TODO**:

* support Linux and Windows too.
* link to [zeroconf-redux] and [x3dom-livereload].

## License

[MIT](http://g14n.info/mit-license/)

<sub>OS icons provided by <a href="https://icons8.com/">icons8</a>.</sub>

[zeroconf-redux]: http://g14n.info/zeroconf-redux
[x3dom-livereload]: http://g14n.info/x3dom-livereload
