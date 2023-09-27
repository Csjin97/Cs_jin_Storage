# shell script


# Check OS
unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    *)          machine="UNKNOWN:${unameOut}"
esac
echo ${machine}
# Check Shell
case "$SHELL" in
    *bash)    mode=bash;;
esac
echo ${mode}

if [ "${machine}" = "Linux" ]; then
        installer='sudo apt-get install -y'
        instcmd='sudo apt list'
        manager='sudo systemctl'
        declare -a pkgmainlist=( "nginx" "mariadb-server" "redis-server" )
        declare -a svcmainlist=( "nginx" "mariadb-server" "redis-server" )
fi

# $1 : package / config / start / stop / terminal / py3 / pip / cert
# $2 : all / nginx / mariadb / redis / clamav
terminal=" - "
package=" - "
nginx=" - "
mariadb=" - "
redis=" - "
start=" - "
stop=" - "
py3=" - "
pip=" - "
config=" - "
if [ "$1" = "terminal" ]; then
        terminal="yes"
elif [ "$1" = "package" ]; then
        package="yes"
        if [ "$2" = "all" ]; then
                declare -a pkglist=( ${pkgmainlist[@]:0:1} ${pkgmainlist[@]:1:1} ${pkgmainlist[@]:2:1} ${pkgmainlist[@]:3:1} ${pkgmainlist[@]:4:1} )
        elif [ "$2" = "nginx" ]; then
                declare -a pkglist=( ${pkgmainlist[@]:0:1} )
        elif [ "$2" = "mariadb" ]; then
                declare -a pkglist=( ${pkgmainlist[@]:1:1} )
        elif [ "$2" = "redis" ]; then
                declare -a pkglist=( ${pkgmainlist[@]:2:1} )
        fi
elif [ "$1" = "start" ]; then
        start="yes"
elif [ "$1" = "stop" ]; then
        stop="yes"
elif [ "$1" = "config" ]; then
        config="yes"
elif [ "$1" = "py3" ]; then
        py3="yes"
elif [ "$1" = "pip" ]; then
        pip="yes"
fi

if [ "$2" = "all" ]; then
        declare -a svclist=( ${svcmainlist[@]:0:1} ${svcmainlist[@]:1:1} ${svcmainlist[@]:2:1} ${svcmainlist[@]:3:1} ${svcmainlist[@]:4:1} )
        nginx="yes"
        mariadb="yes"
        redis="yes"
elif [ "$2" = "nginx" ]; then
        declare -a svclist=( ${svcmainlist[@]:0:1} )
        nginx="yes"
elif [ "$2" = "mariadb" ]; then
        declare -a svclist=( ${svcmainlist[@]:1:1} )
        mariadb="yes"
elif [ "$2" = "redis" ]; then
        declare -a svclist=( ${svcmainlist[@]:2:1} )
        redis="yes"
fi

# $1: title $2: key
func_state() {
        printf "$1"
        if [ "$2" = "yes" ]; then
                if [ "${nginx}" = "yes" ]; then
                        printf "    yes    |"
                else
                        printf "     -     |"
                fi
                if [ "${mariadb}" = "yes" ]; then
                        printf "    yes    |"
                else
                        printf "     -     |"
                fi
                if [ "${redis}" = "yes" ]; then
                        printf "    yes    |"
                else
                        printf "     -     |"
                fi
                printf "     -     |     -     |\n"
        else
                printf "     -     |     -     |     -     |     -     |     -     |     -     |\n"
        fi
}


#echo ${pkglist}
#echo ${svclist}

echo "--------------------------------------------------------------------------------"
printf "       |   nginx   |  mariadb  |   redis   |  python3  |    pip    |\n"
func_state "Intall |" ${package}
func_state "Config |" ${config}
func_state "Start  |" ${start}
func_state "Stop   |" ${stop}
echo "--------------------------------------------------------------------------------"

# Shell Environment
if [ "${terminal}" = "yes" ]; then
        printf "export TERM=xterm-color\n" >> ~/.bash_profile
        printf "export CLICOLOR=1\n" >> ~/.bash_profile
        printf "export LSCOLORS=GxFxCxDxBxegedabagaced\n" >> ~/.bash_profile
        printf "export GREP_OPTIONS='--color=auto'\n" >> ~/.bash_profile
        printf "alias ls='ls -GFh'\n" >> ~/.bash_profile
        printf "alias ll='ls -l'\n" >> ~/.bash_profile
        printf ":syntax on\n" >> ~/.vimrc
fi


# function package / start / stop $2
func_master() {
        if [ "$1" = "package" ]; then
                echo Install ${installer} $2
                eval ${installer} $2
        elif [ "$1" = "start" ]; then
                echo "Start Service: $2"
                ${manager} enable $2
                eval ${manager} start $2
        elif [ "$1" = "stop" ]; then
                echo "Stop Service: $2"
                eval ${manager} stop $2
        fi
}


# Install Package
if [ "${package}" = "yes" ]; then
        echo "------------------------------------------------------------------------------"
        echo " Install Packages"
        echo "------------------------------------------------------------------------------"
        for i in "${pkglist[@]}"
        do
                func_master "package" $i
        done

        echo "------------------------------------------------------------------------------"
        echo " Install Check"
        echo "------------------------------------------------------------------------------"
        for i in "${pkglist[@]}"
        do
                eval ${instcmd} $i
        done
        echo "------------------------------------------------------------------------------"
        echo " Install Complete"
        echo "------------------------------------------------------------------------------"
fi


# Start All Service
if [ "${start}" = "yes" ]; then
        for i in "${svclist[@]}"
        do
                func_master "start" $i
        done
fi
# Stop All Service
if [ "${stop}" = "yes" ]; then
        for i in "${svclist[@]}"
        do
                func_master "stop" $i
        done
fi

if [ "${py3}" = "yes" ]; then
        # Install python3.9
        sudo apt update
        sudo apt install software-properties-common
        sudo add-apt-repository ppa:deadsnakes/ppa
        sudo apt-get install python3.9-dev python3.9-venv
fi

if [ "${pip}" = "yes" ]; then
        # Make VirtualEnv
        python3.9 -m venv ~/venv/py3
        source ~/venv/py3/bin/activate

        # Install pip
        echo "Flask==2.0.3
        gunicorn==20.1.0
        psutil==5.9.0
        pycryptodome==3.14.1
        PyMySQL==1.0.2
        redis==4.2.2
        SQLAlchemy==1.4.32
        grpcio==1.49.1
        grpcio-tools==1.49.1
        python-daemon==2.3.0" >> requirements.txt

        pip install -r requirements.txt

        rm -f requirements.txt
fi

if [ "${config}" != "yes" ]; then
        exit 100
fi

if [ "$2" = "cert" ]; then
	(echo KR; echo GYEONGGI; echo SUWON; echo HIMS.LTD; echo DEV; echo hims.kr; echo aaa@test.com; echo ; echo ; ) | openssl req -new -newkey rsa:2048 -nodes -keyout $1.key -out $1.csr
	openssl x509 -req -days 365 -in $1.csr -signkey $1.key -out $1.crt
	cp $1.key $1.key.secure
	openssl rsa -in $1.key.secure -out $1.key
        rm $1.csr
        rm $1.key.secure
        mv $1.key /opt/hims/ml-websvc/etc/$1.key
        mv $1.crt /opt/hims/ml-websvc/etc/$1.crt
fi



# Config Service
if [ "${nginx}" = "yes" ]; then
        sudo cp ../etc/nginx.conf /etc/nginx/conf.d/
        sudo nginx -s reload
        cp -R ../webroot/* /opt/hims/ml-websvc/webroot/
fi

if [ "${mariadb}" = "yes" ]; then
        # config
        rm hims.sql

        echo "SET Password for 'root'@'localhost' = PASSWORD('hims1111');
        DELETE FROM mysql.user WHERE User='';
        # sudo user 시스템에 따라 변경, 로그인 사용
        DELETE FROM mysql.user WHERE User='hims';
        DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1');
        DROP DATABASE IF EXISTS test;
        DELETE FROM mysql.db WHERE Db='test' OR Db='test\\\\\_%' ;
        FLUSH PRIVILEGES;

        CREATE DATABASE IF NOT EXISTS hims;
        CREATE USER IF NOT EXISTS 'hims'@'localhost' identified by 'hims';
        GRANT ALL PRIVILEGES on hims.* to 'hims'@'localhost';

        \\! echo '---------------------------------------------------------------------';
        \\! echo 'Install User List';
        \\! echo '---------------------------------------------------------------------';
        SELECT host,user,password FROM mysql.user;
        \\! echo '';
        \\! echo '---------------------------------------------------------------------';
        \\! echo '---------------------------------------------------------------------';
        SHOW GRANTS for 'hims'@'localhost';
        \\! echo '---------------------------------------------------------------------';" >> hims.sql

        # Remove User
        #drop user 'hims'@'localhost';
        #flush privileges;

        # Run Setup Command
        sudo mysql -sfu root < "hims.sql"
fi

if [ "${redis}" = "yes" ]; then
        func_master "stop" ${svcmainlist[@]:2:1}
        
        # Only Allow Local Access
        sudo sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
        sudo sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf
        # Start
        func_master "start" ${svcmainlist[@]:2:1}

        echo "
        redis-cli -n 0                  --> session db
        redis-cli -n 1                  --> policy db
        redis-cli -n 2                  --> user db"
        echo "------------------------------------------------------------------------------"
        echo "- Complete Redis"
        echo "------------------------------------------------------------------------------"
fi


# hostname change
# hostnamectl set-hostname abc

# TimeZone
#sudo timedatectl set-timezone Asia/Seoul

