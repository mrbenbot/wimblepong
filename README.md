# Wimblepong

![wimblepong](./public/wimblepong.png)

## Notes

- function
  - undo functionality
  - keep path of ball
  - pause
  - ability to reset / play again
  - input player names
  - sounds should not be biased in two player mode
    - maybe biased towards server?
- style
  - paint a net on the screen?
  - responsive css
  - fast balls should leave marks on the screen?
  - events should have their own style and possibly positioning
    - win streak should have the player name / color
  - full screen button should not show in full screen mode
  - style the scoreboard like BBC wimbledon
  - winner should be displayed clearly
  - stats
  - confetti?
  - visual representation of score (circles?)
  - space dystopia theme
  - make everything big and readable on TV screen
- implementation
  - refactor sounds to react to dispatch events?
  - use css to flip screen and transform observations so that each "player" is given the equivalent input
  - configurability of playing options
  - code split out tensorflow js
  - sounds should be controlled as a side effect of the reducer?

## Computer Player

- update gym env
- allow upload of model in front end

# Menu

- options
  - Human vs Human
    - dj vs dj
    - keyboard vs keyboard?
  - Human vs Machine
    - mouse vs ai paddle
    - mouse vs rule bound paddle
    - dj vs ai paddle
    - dj vs rule bound paddle
  - Machine vs Machine
    - ai vs rule bound
    - ai vs ai
