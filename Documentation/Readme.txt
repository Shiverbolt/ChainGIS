If we use normal ipfs-

Data stored on IPFS is decentralized and can be accessed from anywhere as long as it is still stored in the IPFS network. 
The data is identified by a unique hash, which is derived from the content of the data and not the location where it is stored. 
This means that the data can be retrieved from any node in the IPFS network that has the data, making it easily accessible from anywhere in the world.

It's important to note that data stored on IPFS is not guaranteed to be permanent, as nodes in the network can choose to remove content at any time. 
To ensure the data is available for longer periods of time, it's recommended to pin the data on a node with a large amount of storage or use a dedicated IPFS hosting service.



If we use locally hosted ipfs-

We can locally host the data on IPFS by running a node on your own computer. 
Running a node on your own computer means you can access the data stored on IPFS directly from your computer, without having to go through a public gateway. 
This makes it faster and more reliable to access the data, as you don't have to rely on the availability of public gateways.

Here is an example of how you can install and run an IPFS node on your computer:

    * Install IPFS: You can install IPFS on your computer by following the instructions on the IPFS website (https://docs.ipfs.io/introduction/install/).

    * Start the IPFS daemon: Start the IPFS daemon on your computer by running the ipfs daemon command in your terminal or command prompt.

    * Add data to IPFS: You can add data to IPFS using the ipfs add command. For example, to add a file, you can run the following command: ipfs add file.txt.

    * Access the data: You can access the data on IPFS by using the IPFS gateway (http://localhost:8080/ipfs/{hash}), where {hash} is the hash of the data you added.

With a locally hosted IPFS node, you can store and access the data stored on IPFS directly from your computer, without having to rely on public gateways.


By default, a locally hosted IPFS node is only accessible from within the local network. 
This means that other users who are not on the same network as your computer will not be able to access the data stored on IPFS using your node.

If you want to allow other users to access the data stored on your IPFS node from outside your local network, you will need to configure port forwarding on your router or use a solution like a VPN to make your node publicly accessible. 
It's important to note that exposing your IPFS node to the public internet can increase the security risks and it's recommended to take proper security measures such as firewall configuration and regular backups.

Alternatively, you can use a public IPFS gateway, which is a node hosted by a third-party service that allows you to access data stored on IPFS from anywhere on the internet. 
Public IPFS gateways are easy to use and do not require any additional configuration, but they rely on the availability and reliability of the third-party service.
