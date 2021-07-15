/**
 * Usage guide :
 * - `npm install`
 * - `npm run build`
 * - `node index.js --region region --war war --output output/path`
 *      (example : node .\dist\index.js --region "JP" --war 308 --output C:\ScriptOutputs)
 */


import yargs from 'yargs'
import {
    existsSync,
    mkdirSync,
    statSync,
    accessSync,
    constants,
    readdirSync,
    readFileSync,
    writeFileSync
} from 'fs'
import {
    join,
    basename,
    extname
} from 'path'

export enum Region {
    JP = "JP", NA = "NA",
}

const argv = yargs
    .option('region', {
        description: 'Game region. JP or NA.',
        choices: ['NA', 'JP'],
        demandOption: true,
    })
    .option('war', {
        description: 'A Singularity, Lostbelt, or Event ID.',
        demandOption: true,
        type: 'number'
    })
    .option('output', {
        description: 'A folder to output parsed objects.',
        demandOption: true,
        type: 'string'
    })
    .option('apiserver', {
        description: 'Location of API server. Default is AA-DB.',
        type: 'string',
        default: 'https://api.atlasacademy.io/'
    })
    .check(argv => {
        if (!existsSync(argv.output)) mkdirSync(argv.output)

        let outputStat = statSync(argv.output)
        if (!outputStat.isDirectory()) throw new Error(`${argv.output} is not a directory!`)
        accessSync(argv.output, constants.W_OK)

        return true
    })
    .parseSync()

const region = argv.region.toLowerCase() === 'jp' ? Region.JP : Region.NA
const war = argv.war
const apiserver = argv.apiserver.replace(/\/?$/, '/')

function fileLoader(location) {
// "location" is URL. This function must return raw file data from given URL.
// The problem is "undefined" SyntaxError. "rawData" must be filled with data, 
    var rawData = ''
    // please(location)
    return rawData
}

var questList: {
    questNum ? : number,
    phaseNum ? : number,
    questName: string,
    questID: number,
    questUrl: string
} [] = []

let warName: string

function questListExtraction() {
    const warUrl = apiserver + 'nice/' + region + '/war/' + war
    const warFile = fileLoader(warUrl)
    const warJson = JSON.parse(warFile)
    let warName = warJson.Name
    for (var i = 0; i < warJson.spots.length; i++) {
        for (var j = 0; j < warJson.spots[i].quests.length; j++) {
            var questNum = j + 1
            var questID = warJson.spots[i].quests[j].id
            var questName = warJson.spots[i].quests[j].name
            for (var k = 0; k < warJson.spots[i].quests[j].phases.length; k++) {
                var phaseNum = k + 1
                if (warJson.spots[i].quests[j].type == 'main') {
                    questList.push({
                        questNum: questNum,
                        phaseNum: phaseNum,
                        questName: questName,
                        questID: questID,
                        questUrl: apiserver + 'nice/' + region + '/quest/' + questID + '/' + k
                    })
                } else {
                    questList.push({
                        questNum: null,
                        phaseNum: null,
                        questName: questName,
                        questID: questID,
                        questUrl: apiserver + 'nice/' + region + '/quest/' + questID + '/' + k
                    })
                }
            }
        }
    }
    console.log('Quest List Loading Complete')
}

var scriptList: {
    questNum ? : number,
    phaseNum: number,
    shotNum: number,
    questName: string,
    questID: number,
    scriptID: number,
    scriptUrl: string
} [] = []

function scriptListExtraction() {
    for (var m = 0; m < questList.length; m++) {
        var questFile = fileLoader(questList[m].questUrl)
        var questJson = JSON.parse(questFile)
        for (var n = 0; n < questJson.scripts.length; n++) {
            var shotNum = n + 1
            var scriptID = questJson.scripts[n].scriptId
            var scriptUrl = questJson.scripts[n].script
            scriptList.push({
                questNum: questList[m].questNum,
                phaseNum: questList[m].phaseNum,
                shotNum: shotNum,
                questName: questList[m].questName,
                questID: questList[m].questID,
                scriptID: scriptID,
                scriptUrl: scriptUrl
            })
        }
    }
    console.log('Script List Loading Complete')
}

function scriptsDownload() {
    for (var p = 0; p < scriptList.length; p++) {
        if (scriptList[p].questNum == null) {
            var script = fileLoader(scriptList[p].scriptUrl)
            var filename: string = scriptList[p].questID + ' ' + scriptList[p].questName + scriptList[p].phaseNum + '-' + scriptList[p].shotNum + ' ' + scriptList[p].scriptID + '.txt'
            console.log(`Writing file ${filename}`);
            writeFileSync(join(argv.output, filename), script);
        } else {
            var script = fileLoader(scriptList[p].scriptUrl)
            var filename: string = warName + ' ' + scriptList[p].questNum + '-' + scriptList[p].phaseNum + '-' + scriptList[p].shotNum + ' ' + scriptList[p].questName + ' ' + scriptList[p].scriptID + '.txt'
            console.log(`Writing file ${filename}`);
            writeFileSync(join(argv.output, filename), script);
        }
    }
}

questListExtraction()
scriptListExtraction()
scriptsDownload()

/* if (test-path -path ./script-orig){
	} else {
	$war = Invoke-WebRequest -Method GET -Uri https://api.atlasacademy.io/nice/JP/war/9068|ConvertFrom-Json|select -expand spots|select -expand quests|select id,phases
    $ErrorActionPreference = 'silentlycontinue'
	$quests = @()
	foreach($id in $war.id){
		foreach($phases in $war.phases) {
			$quest = "https://api.atlasacademy.io/nice/JP/quest/$id/$phases"
			$quests += New-Object psobject -Property @{
				questUrl = $quest
			}  
		}
	}
	$quests = $quests|Sort-Object -unique -property questUrl
    	
	$scripts = @()
	foreach($questUrl in $quests.questUrl){
		$scriptExtract = Invoke-WebRequest -Method GET -Uri  "$questUrl"|convertfrom-json|select -expand scripts|select script
		foreach($script in $scriptExtract.script) {
			$scripts += New-Object psobject -Property @{
				scriptUrl = $script
			}
		}  
	}
	$scripts = $scripts|Sort-Object -unique -property scriptUrl
	
	mkdir ./script-orig
	$scripts | ForEach-Object {
		Invoke-WebRequest $_.scriptUrl -OutFile ./script-orig/$(Split-Path $_.scriptUrl -Leaf)
	}
	$ErrorActionPreference = $DefaultErrorActionPreference
}

*/