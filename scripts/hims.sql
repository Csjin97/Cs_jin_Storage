SET Password for 'root'@'localhost' = PASSWORD('hims1111');
        DELETE FROM mysql.user WHERE User='';
        # sudo user 시스템에 따라 변경, 로그인 사용
        DELETE FROM mysql.user WHERE User='hims';
        DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1');
        DROP DATABASE IF EXISTS test;
        DELETE FROM mysql.db WHERE Db='test' OR Db='test\\\_%' ;
        FLUSH PRIVILEGES;

        CREATE DATABASE IF NOT EXISTS hims;
        CREATE USER IF NOT EXISTS 'hims'@'localhost' identified by 'hims';
        GRANT ALL PRIVILEGES on hims.* to 'hims'@'localhost';

        \! echo '---------------------------------------------------------------------';
        \! echo 'Install User List';
        \! echo '---------------------------------------------------------------------';
        SELECT host,user,password FROM mysql.user;
        \! echo '';
        \! echo '---------------------------------------------------------------------';
        \! echo '---------------------------------------------------------------------';
        SHOW GRANTS for 'hims'@'localhost';
        \! echo '---------------------------------------------------------------------';
