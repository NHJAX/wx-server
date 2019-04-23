#!/bin/bash
PATH=/usr/local/bin:/usr/bin
cd /home/pi/apps/wx-client
git pull
echo "Just did git pull"
npm install
echo "Just ran npm install"
pm2 flush
echo "All Logs Flushed"
sudo apt-get -y  update
sudo apt-get -y  upgrade
sudo apt-get -y  dist-upgrade
echo "RPI Updated"
