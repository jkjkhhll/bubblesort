import { GameState, Tube, Level, loadLevels } from "./game"

import * as PIXI from 'pixi.js'

import img_tube from './images/tube.png'

import img_r from './images/r.png'
import img_g from './images/g.png'
import img_b from './images/b.png'
import img_c from './images/c.png'
import img_m from './images/m.png'
import img_y from './images/y.png'
import img_k from './images/k.png'

import img_ok from './images/ok.png'
import img_light from './images/light.png'
import img_reset from './images/reset.png'

// Preload images
const loader = PIXI.Loader.shared
loader.reset()
loader.add('tube', img_tube)
    .add('r', img_r)
    .add('g', img_g)
    .add('b', img_b)
    .add('c', img_c)
    .add('m', img_m)
    .add('y', img_y)
    .add('k', img_k)
    .add('ok', img_ok)
    .add('light', img_light)
    .add('reset', img_reset)

loader.load()

// Screen size (might be better is scalable?)
const WIDTH = 1000
const HEIGHT = 500
let app = new PIXI.Application({ width: WIDTH, height: HEIGHT, backgroundAlpha: 0 })

// Draw single tube and it's bubbles
function drawTube(id: number, x: number, y: number, tube: Tube, active = false) {
    let tubeContainer = new PIXI.Container()
    let tubeSprite = new PIXI.Sprite(loader.resources['tube'].texture)
    tubeSprite.x = 0
    tubeSprite.y = 0

    tubeContainer.addChild(tubeSprite)
    tubeContainer.x = x
    tubeContainer.y = y

    let bottomBubbleY = 148
    for (let b = 0; b < tube.bubbles.length; b++) {
        let bubble = tubeContainer.addChild(new PIXI.Sprite(loader.resources[bubblesprites[tube.bubbles[b]]].texture))
        bubble.x = 15
        if (active && b == tube.bubbles.length - 1) {
            bubble.y = -50
            activeBubble = bubble
            dropTargetY = (bottomBubbleY - (b * 46))
        } else {
            bubble.y = (bottomBubbleY - (b * 46))
        }
        tubeContainer.addChild(bubble)
    }
    tubeContainer.interactive = true
    tubeContainer.on("click", () => {
        clickTube(id)
    })
    tubeSprites.push(tubeContainer)
    app.stage.addChild(tubeContainer)
}


// Draw the game state (all tubes)
function draw(state: GameState) {
    clear()

    let total = 1000
    let margin = (total - (100 * state.tubes.length)) / 2

    let x = margin
    let y = 150
    let spacing = 100

    for (let i = 0; i < state.tubes.length; i++) {
        drawTube(i, x, y, state.tubes[i], (state.activeTube == i))
        x += spacing
    }
}

// Delete all tube and bubble sprites for redraw
function clear() {
    for (let cont of tubeSprites) {
        cont.destroy()
    }
    tubeSprites = []
}

// Tube clicked, basically all possible actions are here 
function clickTube(id: number) {

    if (moveActive || dropActive || showVictory) return

    // Active tube clicked again, drop the bubble
    if (state.activeTube == id) {
        state.activeTube = -1
        dropActive = true
        return
    }

    // No tube active, set this one as active 
    if (state.activeTube == -1) {
        state.activeTube = id
        draw(state)
        return
    }

    let bubble: number = state.tubes[state.activeTube].top()

    // Tube clicked, but can not drop, set the clicked tube as active
    if (!state.tubes[id].canAdd(bubble)) {
        state.activeTube = id
        draw(state)
        return
    }

    // Can drop, start animations and move bubble to new tube
    if (state.tubes[id].canAdd(bubble)) {
        moveTargetTube = id

        moveSprite = PIXI.Sprite.from(activeBubble.texture)

        moveSprite.y = tubeSprites[state.activeTube].y - 50
        moveSprite.x = tubeSprites[state.activeTube].x + 15
        moveTargetX = tubeSprites[id].x + 15

        if (moveTargetX < moveSprite.x) {
            moveLeft = true
        } else {
            moveLeft = false
        }
        moveActive = true
        moveBubble = bubble

        app.stage.addChild(moveSprite)
        activeBubble.destroy()
        state.tubes[state.activeTube].take()
    }

}

// Reload level from description (reset button)
function resetLevel() {
    if (dropActive || moveActive || showVictory) return

    state = new GameState(levels[currentLevel])
    draw(state)
}

// Animations
app.ticker.add((delta) => {

    // Move bubble sideways to another tube
    if (moveActive) {
        if (moveLeft && moveSprite.x > moveTargetX + moveSpeed) {
            moveSprite.x -= moveSpeed
        } else if ((!moveLeft) && moveSprite.x < moveTargetX - moveSpeed) {
            moveSprite.x += moveSpeed
        } else {
            // Move complete, click the tube to activate drop animation
            moveActive = false
            moveSprite.destroy()
            state.activeTube = moveTargetTube
            state.tubes[state.activeTube].add(moveBubble)
            draw(state)
            clickTube(state.activeTube)
        }
    }

    // Drop bubble from "active" position to normal position
    // Also after animation, check if the puzzle is solved
    if (dropActive) {
        if (activeBubble.y < dropTargetY - dropSpeed) {
            activeBubble.y += dropSpeed
        } else {
            // Done dropping, redraw and check if the puzzle is solved
            dropActive = false
            draw(state)

            if (state.isSolved()) {

                // Puzzle is solved, show victory animation
                victorySprite = new PIXI.Sprite(loader.resources['ok'].texture)
                victoryLight = new PIXI.Sprite(loader.resources['light'].texture)
                victoryLight.anchor.set(0.5)
                victoryLight.alpha = 0.5
                victoryLight.x = 300
                victoryLight.y = 200
                victoryContainer.addChild(victoryLight, victorySprite)

                showVictory = true
                victoryTime = delta
            }

            state.activeTube = -1
            draw(state)
        }
    }

    // Victory animation after solved puzzle
    // After animation finishes, load next level 
    if (showVictory) {
        victoryTime += delta
        victoryLight.rotation += 0.01
        if (victoryTime > 100) {
            if (currentLevel < levels.length - 1) {
                currentLevel += 1
            }
            state = new GameState(levels[currentLevel])
            victorySprite.destroy()
            victoryLight.destroy()
            showVictory = false
            draw(state)
        }
    }
})

// Map numbers to letters
let bubblesprites = ['r', 'g', 'b', 'c', 'm', 'y', 'k']

// Reset button
let resetSprite: PIXI.Sprite
let activeBubble: PIXI.Sprite
let moveSprite: PIXI.Sprite
let victorySprite: PIXI.Sprite
let victoryLight: PIXI.Sprite

// Store tubes (and bubbles) so that they can be deleted on redraw
let tubeSprites: PIXI.Container[] = []

// Start from level 0
let levels = loadLevels()
let currentLevel = 0
let state = new GameState(levels[currentLevel])

// Drop animation
let dropActive = false
let dropSpeed = 20
let dropTargetY = 0

// Move animation
let moveActive = false
let moveTargetX = 0
let moveTargetTube = -1
let moveBubble = -1
let moveSpeed = 30
let moveLeft = false

// Victory animation
let showVictory = false
let victoryTime = 0
let victoryContainer = new PIXI.Container()
victoryContainer.x = WIDTH / 2 - (595 / 2)
victoryContainer.y = HEIGHT / 2 - (400 / 2)
victoryContainer.zIndex = 100

// Start the game after preloading images
loader.onComplete.add(() => {
    let gameDiv = document.querySelector("#game")
    if (gameDiv) {
        gameDiv.appendChild(app.view)
    }

    resetSprite = new PIXI.Sprite(loader.resources['reset'].texture)
    resetSprite.x = (WIDTH / 2) - 42
    resetSprite.y = 400
    resetSprite.interactive = true
    resetSprite.buttonMode = true
    resetSprite.on("click", resetLevel)
    app.stage.addChild(resetSprite)

    app.stage.addChild(victoryContainer)
    app.stage.sortableChildren = true
    draw(state)
})




