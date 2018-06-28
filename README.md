# Codius CLI
> Command Line Interface for Codius

[![NPM Package](https://img.shields.io/npm/v/codius.svg?style=flat)](https://npmjs.org/package/codius)
[![CircleCI](https://circleci.com/gh/codius/codius.svg?style=shield)](https://circleci.com/gh/codius/codius)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

The Command Line Interface for uploading and extending pods on Codius.

## Overview
The Codius CLI supports uploading & extending pods on codius hosts.

## Upgrade Notes
If upgrading from Codius CLI 2.0.x please note that the LevelDB dependency is removed so you will be unable to access the
list of currently uploaded **pods** and **stored manifests**.
It's recommended that you save your list of pods and export any manifests that you do not have access to
befor upgrading.

### Listing all uploaded pods
Use the command
```
codius pods -l
```
to list all pods you have uploaded. Redirect this command to a file to save the list. For example
```
codius pods -l > myPodList.json
```

### Exporting a manifest
For each manifest you wish to keep using that you do not have stored locally export it from LevelDB using the command
```
codius pods -m [manifestHash]
```
For example the following will export the pod with the manifes hash `s5e3eqgzy4eqvsejphru6y62uw325nj7tvqr7a2pqxohtkcd6wj` to the file `s5e3eqgz-manifest-backup.json`

```
codius pods -m s5e3eqgzy4eqvsejphru6y62uw325nj7tvqr7a2pqxohtkcd6wjq > s5e3eqgz-manifest-backup.json
```

Repeat the command above for all the manifests you need to preserve so you can keep the pod running or upload them to a new host.
Follow the section [Manually Creating a Codius State File](#manually-creating-a-codius-state-file) to learn how to manually make
a Codius State File from your existing manifests.

## Prerequisites

* NodeJS
* An XRP Wallet (you will need at least 20 XRP to open a new one)
* [Moneyd](https://github.com/interledgerjs/moneyd)

## Installation
The Codius CLI can be installed globally by running the following command:
```
npm install -g codius
```
It can then be run with the command `codius`.

## How to Use
### Terms
 * **Codius File**: File named `codius.json` which contains the main details of the manifest along with variable place holders to be interpolated by the actual values in the  `codiusvars.json` file.
 * **Codius Vars File**: File named `codiusvars.json` which containts the public and private vars which will be interpolated with the `codius.json` file to generate the full manifest.
 * **Codius State File**: File named `default.codiusstate.json` which is created by the upload command on successful upload to at least one host. This file contains the generated interpolated manifest, the hosts its been uploaded to, and details about when the pod expires on those hosts.

### Background
Codius CLI uses a directory per manifest approach where each manifest is composed of at 2 files `codius.json` & `codiusvars.json`.
The upload command uses these 2 files and through interpolation generates the codius manifest for upload to a host. By default the upload command looks for those files in its current directory.
Once uploaded the generated manifest is stored locally in a `default.codiusstate.json` file.
This file contains all the infromation needed to extend and manage the generated manifest.

Manifest should be stored on a per folder basis and be broken up into a `codius.json` & `codiusvars.json` file.
An example folder structure is how the [Codius Examples](https://github.com/codius/examples) repo is setup.
```
examples
├── host-list
│   ├── codius.json
│   └── codiusvars.json
├── nginx
│   ├── codius.json
│   └── codiusvars.json
├── quake
│   ├── codius.json
│   └── codiusvars.json
└── react-app
    ├── codius.json
    └── codiusvars.json
```
This setup allows the user to save the `codius.json` & `codiusvars.json` in any version control software.
The `codius.json` file can then be shared with anyone without exposing the private or public variables used
by your application. After upload the `default.codiusstate.json` file will be generated in the folder which
can also be added to version control to keep track of the generated manifest and where the pods are running.

After uploading the 4 apps above from the examples the folder structure would look as follows.
```
examples
├── host-list
│   ├── codius.json
│   ├── codiusvars.json
│   └── default.codiusstate.json
├── nginx
│   ├── codius.json
│   ├── codiusvars.json
│   └── default.codiusstate.json
├── quake
│   ├── codius.json
│   ├── codiusvars.json
│   └── default.codiusstate.json
└── react-app
    ├── codius.json
    ├── codiusvars.json
    └── default.codiusstate.json
```

### Example Files:
 codius.json
 ```javascript
 {
  "manifest": {
    "name": "nginx-codius-pod",
    "version": "1.0.0",
    "machine": "small",
    "port": "80",
    "containers": [{
      "id": "app",
      "image": "nginx@sha256:3e2ffcf0edca2a4e9b24ca442d227baea7b7f0e33ad654ef1eb806fbd9bedcf0",
      "command": ["nginx", "-g", "daemon off;"],
      "workdir": "/root",
      "environment": {
        "EXAMPLE_PUBLIC_ENV": "$EXAMPLE_PUBLIC_ENV",
        "EXAMPLE_PRIVATE_ENV": "$EXAMPLE_PRIVATE_ENV"
      }
    }]
  }
}
 ```

 codiusvars.json
 ```javascript
{
  "vars": {
    "public": {
      "EXAMPLE_PUBLIC_ENV": {
        "value": "Public Env Value"
      }
    },
    "private": {
      "EXAMPLE_PRIVATE_ENV": {
        "value": "Private Env Value",
    "nonce": "jklnfgwekltfhj4io23r89o"
      }
    }
  }
}
 ```


### Uploading a Pod
TODO


### Extending a Pod
TODO

### Extending a Pod by Manifest Hash
TODO

### Advanced Features
TODO
Talk about
- codushosts.json
- editing the default.codiusstate.json file
- how to move from the existing manifest to the new format
- how to manually create a default.codiusstate.json file

## Command Reference
All `codius` commands have a `--help` parameter describing their usage, e.g. `codius upload --help` for help with the `upload` command.

### `upload [options]`
Looks in the current directory for the files `codius.json` & `codiusvars.json` which are used to generate a manifest
which is then used to upload the pod to host(s). By default it upload the pod to a single random known host with a
duration of 10 minutes. Its recommended that you start with a short duration and then extend it to ensure your
manifest is running appropriately. Upload should be used for new manifest where a `default.codiusstate.json` file does not exist.

| Options                      | Argument Type | Description                                                                                                                                                     |
|------------------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --duration, -d               | Integer       | Duration (in seconds) the pod will be run on all Codius hosts, defaults to 10 mins.                                                                             |
| --max-monthly-rate, -m       | Integer       | Max rate per month the uploader is willing to pay a Codius host to run the pod, requires --units flag to be set. Defaults to 10 XRP.                            |
| --units, -u                  | Integer       | The unit of currency to pay the Codius hosts with, e.g. 'XRP'. Defaults to 'XRP'.                                                                               |
| --host-count, -c             | Integer       | The number of hosts to upload the pod to. They are discovered from known hosts and selected randomly. Defaults to 1. This and `--host` are mutually exclusive.  |
| --host                       | String        | The public URI of a host to upload the manifest to. Can be repeated any number of times for multiple hosts. This and `--host-count, -c` are mutually exclusive. |
| --add-host-env, --a          | Boolean       | Adds a $HOST env in the manifest before upload which contains all the hosts the manifest will be uploaded to.                                                   |
| --codius-file                | String        | Filename or full path to codius file to be used. If not set the CLI looks in the current directory for the codius.json file.                                    |
| --codius-vars-file           | String        | Filename or full path to the codius variables file to be used. If not set the CLI looks in the current directory for the codiusvars.json file.                  |
| --codius-hosts-file          | String        | Filename or full path to the codius hosts file to be used. If not set the CLI looks in the current directory for the codiushosts.json file.                     |
| --codius-state-file          | String        | Filename or full path to the codius state file to be generated. If not set the CLI will make a default.codiusstate.json file.                                   |
| --overwrite-codius-state, -o | Boolean       | Overwrite the current *.codiusstate.json file if it exists.                                                                                                     |
| --assume-yes, -y             | Boolean       | Say yes to all prompts.                                                                                                                                         |

### `extend [options]`
Used to manage the pod after the initial upload. It extends the duration of a running pod or uploads the pod again if the pod has expired.
Extend can only be used after a `default.codiusstate.json` file exists in the current directory.
The upload command is used to generate that file. When run successfully the `*.codiusstate.json` file will be updated.

| Options                   | Argument Type | Description                                                                                            |
|---------------------------|---------------|--------------------------------------------------------------------------------------------------------|
| --duration, -d               | Integer       | Duration (in seconds) the pod will be run on all Codius hosts, defaults to 10 mins.                                                                             |
| --max-monthly-rate, -m       | Integer       | Max rate per month the uploader is willing to pay a Codius host to run the pod, requires --units flag to be set. Defaults to 10 XRP.                            |
| --units, -u                  | Integer       | The unit of currency to pay the Codius hosts with, e.g. 'XRP'. Defaults to 'XRP'.                                                                               |
| --codius-state-file          | String        | Filename or full path to the codius state file to be generated. If not set the CLI will make a default.codiusstate.json file.                                   |
| --assume-yes, -y             | Boolean       | Say yes to all prompts.                                                                                                                                         |

### extend-hash <hash> [options]
Extends a pod using the provided manifest hash on the host. Allows anyone to extend a pod if they know the manifest hash and the host.
ex `extend-manifest hyg2qziqlhdogtbxm347spzrwkibgbzdalyj2qavqra4gzmm5jzq --host https://codius.tinypolarbear.com`

Arguments:
* `<manifest-hash>`
  * Type: Object
  * Description: The path to the manifest with information about your program. Format is described [here](https://github.com/codius/manifest).

| Options                   | Argument Type | Description                                                                                            |
|---------------------------|---------------|--------------------------------------------------------------------------------------------------------|
| --duration, -d               | Integer       | Duration (in seconds) the pod will be run on all Codius hosts, defaults to 10 mins.                                                                             |
| --max-monthly-rate, -m       | Integer       | Max rate per month the uploader is willing to pay a Codius host to run the pod, requires --units flag to be set. Defaults to 10 XRP.                            |
| --units, -u                  | Integer       | The unit of currency to pay the Codius hosts with, e.g. 'XRP'. Defaults to 'XRP'.                                                                               |
| --codius-state-file          | String        | Filename or full path to the codius state file to be generated. If not set the CLI will make a default.codiusstate.json file.                                   |
| --assume-yes, -y             | Boolean       | Say yes to all prompts.                                                                                                                                         |

## License
Apache-2.0
