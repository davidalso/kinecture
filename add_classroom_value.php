<?php
        require_once("_config.php");
        header("Access-Control-Allow-Origin: http://kinecture.meteor.com");

        $timestamp = $_GET['timestamp'];
        $eventType = $_GET['eventType'];
        $speakerX  = $_GET['speakerX'];
        $speakerY  = $_GET['speakerY'];
        $condition = $_GET['condition'];
        $sessionID = $_GET['sessionID'];

        $mysqli = new mysqli($mysql_host, $mysql_user, $mysql_pass, $mysql_db) or die("Error: " . $mysqli->error);
        
        //$timestamp = (new DateTime())->getTimestamp();

        $query = "INSERT INTO `events` " .
            "(`timestamp`, `eventType`, `speakerX`, `speakerY`, `condition`, `sessionID`) VALUES (?,?,?,?,?,?)";
        
        echo $query;

        $stmt = $mysqli->prepare($query);
        $stmt->bind_param('ssddss', $timestamp, $eventType, $speakerX, $speakerY, $condition, $sessionID);

        if ($stmt->execute() === TRUE) {
            if ($_GET['admin'])
            {
                echo 'admin = true';
            }
            else
            {
                echo 'YAY';
            }
        } else {
            echo "<li>Error: " . $mysqli->error . "</li>";
        }
        
        $mysqli->close();
?>