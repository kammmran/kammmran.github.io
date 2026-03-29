OXgame is a two-player game where players compete by placing matryoshka-like pieces of different sizes and colors on a 3x3 board. The goal is to align three pieces in a row, column, or diagonal to win.

___

### TUTORIAL

<p align="center">
  <img src="https://raw.githubusercontent.com/kamranayazheydarov/OXgame/refs/heads/master/black.png" alt="Black Character">
  <img src="https://raw.githubusercontent.com/kamranayazheydarov/OXgame/refs/heads/master/blue.png" alt="Blue Character">
</p>

___

### IDEA OF THE GAME

Each player has two colors of matryoshka-like characters (black and blue), available in three sizes: small, medium, and large. The game board is 3x3, and players can add their matryoshkas to this board according to specific rules:

1. **Placement Order**: Pieces must be placed in order of size—small first, then medium, and finally large.
2. **Limited Uses**: Each piece can only be used twice. After the first use, the piece appears with a “used” indicator. After the second use, it is removed from the game.
3. **Winning Condition**: The first player to align three of their pieces in a row, column, or diagonal wins.

___

### GAME PLAY

To start playing, open the game file. Follow the on-screen instructions to place your pieces and aim to align three in a row, column, or diagonal.

___

### SETUP AND BUILD INSTRUCTIONS

#### Clone the Repository
1.First, clone the repository to your local machine:
```bash
git clone https://github.com/kammmran/OXgame.git
```
2.Install Python 3.7.5 or Later
> Make sure you have Python 3.7.5 or a later version installed.

3.Install Required Libraries
Run the following commands to install the necessary libraries:
* Tkinter (for GUI support):
```bash 
sudo apt install python3-tk
```
* Playsound (for sound functionality):

```bash
pip install playsound
```
* Pillow (image library; use a version below 10.0.0 for ANTIALIAS support):
```bash
pip3 install "Pillow<10.0.0"
```

4.Run the Game
>Once the dependencies are installed, you can start the game by running the main Python file in your preferred environment (VS Code or PyCharm).


```vbnet
This Markdown section is formatted for readability and includes the installation steps clearly. Let me know if you’d like any adjustments!
```