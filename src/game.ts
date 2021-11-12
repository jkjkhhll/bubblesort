import { levelDescriptions } from "./levels"


export class Tube {
    bubbles: number[]
    maxBubbles: number

    constructor(bubbles: number[] = [], maxBubbles = 4) {
        this.bubbles = bubbles
        this.maxBubbles = maxBubbles
    }

    add(b: number) {
        this.bubbles.push(b)
    }

    take() {
        return this.bubbles.pop()
    }

    top() {
        return this.bubbles[this.bubbles.length - 1]
    }

    isEmpty() {
        return this.bubbles.length == 0
    }

    canAdd(b: number) {
        return this.isEmpty() || (this.bubbles.length < this.maxBubbles && this.top() === b)
    }

    isSolved() {
        if (this.isEmpty()) return false

        let allSame = this.bubbles.every((b) => b === this.bubbles[0])
        return (this.bubbles.length == this.maxBubbles) && allSame
    }
}

export class GameState {
    level: Level
    activeTube: number = -1
    tubes: Tube[] = []

    constructor(level: Level) {
        this.level = level

        for (let tube of level.initialState) {
            this.tubes.push(new Tube(tube.slice(), 4))
        }
    }

    isWon() {
        return this.tubes.every((tube) => tube.isEmpty() || tube.isSolved())
    }

}

export class Level {
    initialState: number[][] = []
    nTubes: number
    nColors: number

    constructor(levelDesc: string) {
        let tubes = levelDesc.split(",")
        this.nTubes = tubes.length

        let colors: number[] = []
        let colorStrings = ['r', 'g', 'b', 'c', 'm', 'y', 'k']

        tubes.forEach((t) => {
            let tube: number[] = []
            if (!(t == "-")) {
                for (let c of t) {
                    let color = colorStrings.indexOf(c)
                    tube.push(color)
                    if (colors.indexOf(color) == -1)
                        colors.push(color)
                }
            }
            this.initialState.push(tube)
        })
        this.nColors = colors.length
    }
}

export function loadLevels() {
    let levels: Level[] = []

    for (let leveldesc of levelDescriptions) {
        levels.push(new Level(leveldesc))
    }

    return levels
}