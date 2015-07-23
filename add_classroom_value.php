<?php
        require_once("_config.php");
        header("Access-Control-Allow-Origin: http://kinecture.meteor.com");

        $timestamp = $_GET['timestamp'];
        $eventType = $_GET['eventType'];
        $speakerX  = $_GET['speakerX'];
        $speakerY  = $_GET['speakerY'];
        $condition = $_GET['condition'];
        $sessionID = $_GET['sessionID'];
        $angleLeft = $_GET['angleLeft'];
        $angleRight = $_GET['angleRight'];
        $confidenceLeft = $_GET['confidenceLeft'];
        $confidenceRight = $_GET['confidenceRight'];
        $loudnessLeft = $_GET['loudnessLeft'];
        $loudnessRight = $_GET['loudnessRight'];
        $silenceLeft = $_GET['silenceLeft'];
        $silenceRight = $_GET['silenceRight'];

        echo 'Timestamp: ' . $timestamp . '<br>';
        echo 'EventType: ' . $eventType . '<br>';
        echo 'speakerX: ' . $speakerX . '<br>';
        echo 'speakerY: ' . $speakerY . '<br>';
        echo 'condition: ' . $condition . '<br>';
        echo 'sessionID: ' . $sessionID . '<br>';
        echo 'angleLeft: ' . $angleLeft . '<br>';
        echo 'angleRight: ' . $angleRight . '<br>';
        echo 'confidenceLeft: ' . $confidenceLeft . '<br>';
        echo 'confidenceRight: ' . $confidenceRight . '<br>';
        echo 'silenceLeft: ' . $silenceLeft . '<br>';
        echo 'silenceRight: ' . $silenceRight . '<br>';
        

        $mysqli = new mysqli($mysql_host, $mysql_user, $mysql_pass, $mysql_db) or die("Error: " . $mysqli->error);
        
        //$timestamp = (new DateTime())->getTimestamp();

        $query = "INSERT INTO `tuning` " .
            "(`eventType`, `speakerX`, `speakerY`, `condition`, `sessionID`,`timestamp`,`angleLeft`, `angleRight`, `confidenceLeft`, `confidenceRight`, `loudnessLeft`, `loudnessRight`, `silenceLeft `, `silenceRight`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        
        echo $query;

        $stmt = $mysqli->prepare($query);
        $stmt->bind_param('sddsssddddddss',  $eventType, $speakerX, $speakerY, $sessionID, $condision, $timestamp,$angleLeft, $angleRight, $confidenceLeft, $confidenceRight, $loudnessLeft, $loudnessRight, $silenceLeft , $silenceRight);

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