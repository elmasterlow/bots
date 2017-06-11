<?php

namespace Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Facebook\WebDriver\Remote\RemoteWebDriver;
use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\WebDriverBy;
use Facebook\WebDriver\WebDriverWait;
use Facebook\WebDriver\WebDriverExpectedCondition;

class BotCommand extends Command
{
    private $host = 'http://0.0.0.0:4444/wd/hub';

    private $driver;

    private $name = '';

    private $password = '';

    private $log = 'log.txt';

    private $messages = 'messages.txt';

    public function __construct()
    {
        parent::__construct();

        // remember to write about newest version of selenium server and firefox geckodriver
        // https://github.com/mozilla/geckodriver/releases
        // https://github.com/SeleniumHQ/selenium/issues/3630#issuecomment-285636532
        $capabilities = new DesiredCapabilities();
        //http://toolsqa.com/selenium-webdriver/how-to-use-geckodriver/
        $capabilities->setBrowserName('firefox');
        $this->driver = RemoteWebDriver::create($this->host, $capabilities);
    }

    protected function configure()
    {
        $this
            ->setName('bot')
            ->setDescription('Send welcome messages to users just joined')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $this->driver->get('https://www.twitch.tv/login');

        // wait for presence elements
        (new WebDriverWait($this->driver, 10))->until(WebDriverExpectedCondition::presenceOfElementLocated(
            WebDriverBy::id('loginForm')
        ));

        $this->driver->findElement(WebDriverBy::xpath('//*[@id="username"]'))->sendKeys($this->name);
        $this->driver->findElement(WebDriverBy::xpath('//*[@id="password"]/input'))->sendKeys($this->password);

        // if there is no recaptcha to type then click to send button
        /*
        try {
            (new WebDriverWait($this->driver, 5))->until(WebDriverExpectedCondition::presenceOfElementLocated(
                WebDriverBy::xpath('//*[@id="recaptcha-anchor"]/div[5]')
            ));
        } catch(\Exception $e) {
            $this->driver->findElement(WebDriverBy::xpath('//*[@id="loginForm"]/div[3]/button'))->click();
        }
        */

        (new WebDriverWait($this->driver, 15))->until(WebDriverExpectedCondition::titleIs('Twitch'));

        $this->driver->manage()->timeouts()->pageLoadTimeout(30);
        $this->driver->get(sprintf('https://www.twitch.tv/%s', $this->name));

        (new WebDriverWait($this->driver, 15))->until(WebDriverExpectedCondition::presenceOfElementLocated(
            WebDriverBy::xpath('//*[@class="message-line chat-line admin ember-view"]/div/span[5]')
        ));

        $this->loop();
    }

    private function loop()
    {
        $messages = file($this->messages);
        $filesize = filesize($this->log);
        $current = explode(';', file_get_contents($this->log));
        while (1) {
            // new users
            if (filesize($this->log) !== $filesize) {
                $justJoined = explode(';', file_get_contents($this->log));
                $difference = array_diff($justJoined, $current);
                foreach ($difference as $nickname) {
                    $this->driver->findElement(WebDriverBy::xpath('//*[@class="js-chat-input chat-input ember-view"]/textarea'))->sendKeys(sprintf(
                        '/w %s %s', $nickname, $messages[rand(0, count($messages) - 1)]
                    ));
                    $this->driver->findElement(WebDriverBy::xpath('//*[@class="js-chat-interface chat-interface__wrap ember-view"]/div[3]/button'))->click();

                    sleep(rand(5,10));
                }
                $filesize = filesize($this->log);
                $current = $justJoined;
            }
            // https://stackoverflow.com/questions/7664879/using-filesize-php-function-in-a-loop-returns-the-same-size
            clearstatcache();
            sleep(5);
        }
    }
}