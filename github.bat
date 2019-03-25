git add .
set /p commit= Please enter commit :
git commit -m "%commit%"
git push
git checkout master
git merge beta
git push
set /p version= Please enter version :
node version.js %version%
git checkout beta
