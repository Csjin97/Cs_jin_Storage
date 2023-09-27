#!/bin/bash

# create application folders
sudo mkdir -p /opt/hims
sudo mkdir -p /opt/hims/ml-websvc
sudo mkdir -p /opt/hims/ml-websvc/bin
sudo mkdir -p /opt/hims/ml-websvc/etc
sudo mkdir -p /opt/hims/ml-websvc/webroot
sudo mkdir -p /opt/hims/ml-websvc/scripts
sudo chown -R $(id -u):$(id -g) /opt/hims/ml-websvc

# create data folders
sudo mkdir -p /var/opt/hims
sudo mkdir -p /var/opt/hims/ml-websvc
sudo chown -R $(id -u):$(id -g) /var/opt/hims/ml-websvc

# create log folders
sudo mkdir -p /var/log/hims
sudo mkdir -p /var/log/hims/ml-websvc
sudo chown -R $(id -u):$(id -g) /var/log/hims/ml-websvc
