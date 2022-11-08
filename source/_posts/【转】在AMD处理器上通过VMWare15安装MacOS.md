---
title: 【转】在AMD处理器上通过VMWare15安装MacOS
toc: true
cover: 'https://img.paulzzh.tech/touhou/random?87'
date: 2020-12-05 21:37:43
categories: 软件安装与配置
tags: [软件安装与配置, VMWare, 虚拟机, 黑苹果, MacOS]
description: 由于需要用到Mac环境，所以在我的VMWare折腾了一下黑苹果，总体来说还是很简单的，只要跟着步骤来就行了；
---

由于需要用到Mac环境，所以在我的VMWare折腾了一下黑苹果，总体来说还是很简单的，只要跟着步骤来就行了；

注：不推荐在虚拟机中深度使用，因为显存只有128M，即使你分配了16核，还是卡顿明显，而且我也用不惯Mac，也没钱买，还是等公司发吧…；

文章参考：

-   [最详细AMD Ryzen CPU，VMware 15安装黑苹果macOS 10.15.x Catalina 记录](https://blog.csdn.net/xiaocheng0404/article/details/106963575)

<br/>

<!--more-->

## **在AMD处理器上通过VMWare15安装MacOS**

### **前言**

不推荐在虚拟机中深度使用，因为显存只有128M，即使你分配了16核，还是卡顿明显，而且我也用不惯Mac，也没钱买，还是等公司发吧…；

>   <font color="#f00">**注：VMware Workstation软件版本不要超过15.1.0以上（目前最新版本是15.5.5或者更高），超过15.1.0的版本无法安装macOS，且暂时无解。**</font>

我的安装环境：

-   CPU：AMD 3700X；
-   OS：Win10企业版 1809
-   VMware Workstation版本：15.1.0；
-   macOS镜像：10.15.5；

<br/>

### **前期准备**

#### **① 开启虚拟化**

可查看任务管理器中的cpu信息，如下：

![vmware_macos_1.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_1.png)

>   若电脑没有开启虚拟化，则需要在BIOS中开启虚拟化；
>
>   关于虚拟化技术：Intel的cpu是“Intel Virtualization Technology”或简写成“Intel VT”，而AMD的cpu是“SVM Support”；

#### **② 关闭不必要服务**

关闭一些`占用虚拟化服务`的软件：

-   关闭**360的核晶防护（如果有360的话~）；**
-   关闭**Hyper-V功能；**
-   关闭**Win10安全中心的内存完整性；**

![vmware_macos_2.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_2.png)

![vmware_macos_3.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_3.png)

#### **③ 工具准备**

虚拟机安装mac OS，需要准备如下工具：

软件VMware Workstation 15.1.0：

-   https://www.cnblogs.com/mr-xiong/p/12468280.html

unlocker解锁工具：

-   https://github.com/theJaxon/unlocker

macOS 10.15.5镜像：

-   https://www.mfpud.com/macos/cdr/
-   https://cloud.tencent.com/developer/article/1537946

>   百度云统一下载：
>
>   https://pan.baidu.com/s/11v0XPkJWdLW01QAVJyiAQg
>
>   提取码：mhh2

>   上面需要的资源Google随便搜一搜就有了！
>
>   需要注意的是：VMWare目前一定要是15.x，16.x是不行的！
>
>   另外macOS尽量选择10.15.X；

##### **1.VMware Workstation 15.1.0安装**

1.  安装前：若是先前安装过其他版本的VMware Workstation要先卸载，卸载完后重启，再安装15.1.0这个版本；
2.  安装（建议，软件不要装c盘），安装没什么难度，一直下一步即可，最后输入许可证（要是都失效了，可以百度搜索，网上有许多）：
    1.  YG5H2-ANZ0H-M8ERY-TXZZZ-YKRV8
    2.  UG5J2-0ME12-M89WY-NPWXX-WQH88
    3.  UA5DR-2ZD4H-089FY-6YQ5T-YPRX6
    4.  GA590-86Y05-4806Y-X4PEE-ZV8E0
3.  安装后，软件会提示重启电脑，可以不用重启；

##### **2.unlocker解锁工具**

安装完VMware Workstation后，我们还需要一个工具unlocker对VMware Workstation进行解锁；

解锁有两个目的：一是让VMware Workstation支持macOS（不然后面步骤中新建虚拟机是看不到“Apple Mac OS X”选项的）；二是下载更新最新的darwin.iso（如果这个不是最新的，安装后的macOS无法全屏）；

开始使用unlocker对VMware 进行解锁：

1.  进入unlocker目录；
2.  找到该目录下的`win-install.cmd`；
3.  右键win-install.cmd，找到“管理员身份运行”，运行即可；

unlocker运行后，一般会自动下载一个文件：（com.vmware.fusion.tools.darwin.zip.tar）；

此时若下载失败则install将会失效，需自行解决网络问题！

**安装完成后，unlocker会自动关闭窗口，这时重新启动电脑**

<br/>

### **创建虚拟机**

1.新建虚拟机；

![vmware_macos_4.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_4.png)

2.选择自定义（高级）；

![vmware_macos_5.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_5.png)

3.选择虚拟机硬件兼容性，选择默认就好；

![vmware_macos_6.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_6.png)

4.选择我们下载的macOS 10.15.5.cdr，注意选择文件的时候，我们选择“所有文件(*.*)，就能看到我们的cdr镜像了”；

![vmware_macos_7.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_7.png)

5.客户机操作系统，勾选Apple Mac OS X，下拉框选择macOS 10.14，（VMware 15.1.0通过unlocker解锁后最高支持支持macOS 10.14，虽然我们将要安装的是macOS 10.15.5，这里选择macOS 10.14）；

![vmware_macos_8.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_8.png)

6.虚拟机名称和虚拟机路径，这里名称和路径最好选择英文哦（老外的软件对中文适配差）。**虚拟机安装路径最好选择固态硬盘，容量100G以上**

![vmware_macos_9.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_9.png)

7.处理器配置，这里处理器配置选择数量为1，核心数选择4（为了提高安装成功率，先这样选择，后面可以根据需要改）

![vmware_macos_10.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_10.png)

8.虚拟机内存选择，4GB，8GB，16GB都可以（为了提高安装成功率，先这样选择，后面可以根据需要改）

![vmware_macos_11.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_11.png)

9.网络连接，选择网络地址转换"NAT"，（先这样选择，后面可以根据需要改，若是NAT网络无法使虚拟机上网，后面可以更改为其他上网方式直至虚拟机能上网即可）

![vmware_macos_12.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_12.png)

10.I/O控制器，SCSI控制器，选择LSI Logic；

![vmware_macos_13.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_13.png)

11.虚拟磁盘类型选择 SATA；

![vmware_macos_14.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_14.png)

12.磁盘选择创建新虚拟磁盘；

![vmware_macos_15.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_15.png)

13.磁盘大小选择80GB（后面可以根据需要扩容），不勾选立即分配所有磁盘空间（不勾选的话，前面选择的80GB不会立即分配，虚拟机会根据使用情况自动增加），选择将虚拟磁盘存储为单个文件（方便备份，虚拟机苹果还是不稳定的，我们可以在装好macOS后备份一个，后期可以直接打开备份好的macOS）；

![vmware_macos_16.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_16.png)

14.指定磁盘文件，默认就好，下一步；

![vmware_macos_17.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_17.png)

15.选择完成；

![vmware_macos_18.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_18.png)

<br/>

### **配置虚拟机**

1.虚拟机建好后，我们不要开启虚拟机，还得进行一些设置，选择编辑虚拟机设置；

![vmware_macos_19.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_19.png)

2.处理器，勾选虚拟化Intel VT-x/EPT 或 AMD-V/RVI；

![vmware_macos_20.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_20.png)

3.USB控制器，选择兼容USB2.0，下面两个都勾选（否则在虚拟机中键盘用不了）；

![vmware_macos_21.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_21.png)

4.**在常规-客户机操作系统中我们选择客户机操作系统为Windows 10 x64，目的是为了引导macOS 10.15.x，毕竟VMWare 10.15.1最高只支持macOS 10.14系列；**

![vmware_macos_22.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_22.png)

5.找到刚刚创建的MacOS虚拟机路径，再找到格式为*.vmx的配置文件（我这里是macOS 10.15.5.vmx，用文本编辑器打开 *.vmx这个配置文件；

![vmware_macos_23.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_23.png)

>   **注意：修改.vmx的配置文件，不要用中文标点符号，不要带任何与中文相关的，否则在安装虚拟机时会出现“字典错误”**

6.打开后，**找到** virtualHW.version = “16”， **找到后修改为**virtualHW.version = “10”；

![vmware_macos_24.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_24.png)

![vmware_macos_25.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_25.png)

7.添加下面的内容；

```
// 找到smc.version，修改为smc.version = "0"，若是没有找到，则将smc.version = "0" 复制到文件末尾
smc.version = "0"

// 复制到文件末尾
cpuid.0.eax = "0000:0000:0000:0000:0000:0000:0000:1011"
cpuid.0.ebx = "0111:0101:0110:1110:0110:0101:0100:0111"
cpuid.0.ecx = "0110:1100:0110:0101:0111:0100:0110:1110"
cpuid.0.edx = "0100:1001:0110:0101:0110:1110:0110:1001"
cpuid.1.eax = "0000:0000:0000:0001:0000:0110:0111:0001"
cpuid.1.ebx = "0000:0010:0000:0001:0000:1000:0000:0000"
cpuid.1.ecx = "1000:0010:1001:1000:0010:0010:0000:0011"
cpuid.1.edx = "0000:1111:1010:1011:1111:1011:1111:1111"
featureCompat.enable = "FALSE"
```

![vmware_macos_26.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_26.png)

**配置文件修改后，文件保存一下；**

8.开启此虚拟机；

<br/>

### **安装macOS（重要，坚持，请按步骤）**

1.启动完成后，我们选择简体中文；

>    打开macOS虚拟机，若是前面的步骤没有问题话，就可以看到这一步了；
>
>   若是前面的步骤有问题，虚拟机一般会提示一些错误，读者可以自行百度，或者留言大家一起解决；

![vmware_macos_27.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_27.png)

2.系统会弹出macOS 实用工具，我们得格式化磁盘了，选择磁盘工具；

（和安装Windows系统一样，安装前得选择分区，格式化~~）

![vmware_macos_28.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_28.png)

3.磁盘工具，选择抹掉（和Windows中的格式化类似）；

![vmware_macos_29.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_29.png)

4.选择抹掉后，会弹出一个对话框，如图；

这里我们将键盘从真机切换到虚拟机，不然这里无法输入。切换的时候会有弹框提示，这里我们直接确定（前面我们设置过“显示所有USB输入设备”和“USB兼容性为2.0”，要是1.1的话鼠标键盘都动不了，2.0的话鼠标还是可以操作的，仅仅将键盘切到虚拟机。

待会将键盘切回到真机也是这个步骤哦），这样我们就能给磁盘命名了，**命名完后记得这个步骤反向操作下，不然真机就用不了键盘了；**

![vmware_macos_30.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_30.png)

5.格式：一定要选Mac OS扩展（日志式），方案：GUID分区图；

若是格式选择带有加密的或大小写敏感的，会在后期使用系统的过程中带来诸多不方便。另外对于格式尤其不要选APFS的，APFS会导致安装失败（其实我们虽然选择Mac OS扩展日志式，macOS 10.15.5安装完后系统会自动格式化为APFS），设置完成后选择对话框中的抹掉即可；

![vmware_macos_31.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_31.png)

6.第5步抹掉完成后，关闭对话框，关闭磁盘工具。来到macOS实用工具界面后，选择安装macOS；

![vmware_macos_32.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_32.png)

7.勾选我们格式化后的磁盘后，开始自动安装，自动重启，期间我们耐心等待（接下来是傻瓜式操作，这里不做详细介绍）；

![vmware_macos_33.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_33.png)

8.不出意外，过一会儿，一定会安装失败，安装过程自动走到macOS实用工具界面，**这里我们直接 关闭客户机**。

（还记得吗，一开始我们将虚拟机设置成Windows10 x64来引导系统，现在系统引导成功后需要将引导方式切回macOS，具体请看步骤9）；

![vmware_macos_34.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_34.png)

9.**这一步很关键，编辑虚拟机设置，将启动模式还原为Apple Mac OS X，下拉框macOS 10.14。期间会弹窗警告，我们一直点确定忽略即可**

![vmware_macos_35.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_35.png)

10.步骤9完成后，我们再次点击“启动此虚拟机”，经过如上操作后我们就能顺利安装macOS 10.15了，也是一些傻瓜式操作：点击“继续”、“继续”、“继续”、“继续”、“继续”…可以跳过登录Apple ID，创建账户，设置一个简单的屏幕锁密码，最好用英文哟，然后再点击“继续”、“继续”、“继续”、“继续”、“继续”…

![vmware_macos_36.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_36.png)

<br/>

### **安装VMware Tools**

1.安装完成后，界面很小，因为还没装一个工具，这里我们选择关机，因为CD/DVD驱动器里是我们的macOS 10.15.5.cdr镜像，要是没有的话，可以跳过这一步；

![vmware_macos_37.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_37.png)

2.**关闭虚拟机后**，编辑虚拟机设置，找到CD/DVD选项，勾选使用物理驱动器；

![vmware_macos_38.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_38.png)

3.设置完成后，再开机，会有个弹框提示，忽略即可，输入完我们刚设置的密码进入系统后我们来安装VMware Tools，如图点击安装VMware Tools；

![vmware_macos_39.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_39.png)

4.过一会桌面会弹出VMware Tools，根据提示安装完即可；

![vmware_macos_40.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_40.png)

5.**安装VMware Tools过程中会有安全提示，根据操作提示，允许即可。一定要允许，这一步很重要，先点击左下角的小黄锁，解锁后才能在这个界面操作；**

![vmware_macos_41.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_41.png)

6.看到VMWare Tools软件提示安装成功完成后，点击重新启动；

![vmware_macos_42.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_42.png)

7.看图，选择全屏icon，看看是否全屏；

![vmware_macos_43.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_43.png)

<br/>

### **虚拟机优化**

>   **关闭虚拟机的情况下操作**

1.电脑配置好的，cpu建议8核，内存16GB；

2.编辑虚拟机设置，找到高级，勾选“禁用内存页面调整”，防止VMware频繁操作磁盘IO；

>   一般情况下，启动虚拟机操作系统后，会在我们的虚拟机操作系统安装目录中生成一个和内存大小一致的虚拟内存文件；
>
>   同样为了防止VMware频繁操作磁盘IO我们也可以禁用；

3.打开*.vmx配置文件，直接在文件末尾追加 `mainMem.useNamedFile = “FALSE”`，保存即可，再重启虚拟机；

>   **上面的优化都只是CPU层面的优化，而显存还是固定128M；**
>
>   **这个问题暂时无解！**

<br/>

### **备份**

 虚拟机装完后，我们根据自己的喜好设置虚拟机，装一些我们常用的软件，这些都弄完后我们就可以备份啦！

备份有什么用呢，黑苹果很“脆弱”，可能哪天不小心升级了VMware，升级了macOS系统后就开不了机了，那个时候备份文件就能派上用场了，我们直接在VMware中打开我们备份的文件！

如何备份，很简单的：

**关闭虚拟机后，直接复制安装目录到其他地方即可**，到时虚拟机出问题了，可以用VMware直接打开我们备份的文件；

<br/>

### **真机与虚拟机文件共享**

文件共享有什么好处，在真机中我们将文件拖到“共享文件夹”中，macOS在“共享文件夹”就能看到我们在真机中放的文件；同样的，在macOS中将文件拖到“共享文件夹”中后，在真机中我们也能看到。类似于真机上的QQ给虚拟机上的QQ发送文件；

1.主机设置（我这里是Win 10），新建一个文件夹，如下图中的Shared文件夹。主机设置将要共享的文件夹，右键Shared，选择属性，找到共享，进行共享；

![vmware_macos_44.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_44.png)

![vmware_macos_45.png](https://raw.fastgit.org/JasonkayZK/blog_static/master/images/vmware_macos_45.png)

>   虚拟机设置，可以查看：
>
>   -   [实现VMware中的mac与主机windows的硬盘文件共享](https://blog.csdn.net/weixin_34292924/article/details/86412816)
>   -   [实现Vmware10中的Mac OS X10.9与主机Windows8.1的硬盘文件共享](https://blog.csdn.net/baigoocn/article/details/38347495?utm_source=blogxgwz4)

<br/>

### **其他问题**

**1.安装完后，macOS 每次开机都会提醒有新系统，或者新补丁可以更新。建议不要更新，否则会有因兼容性问题而无法开机。**

**2.不建议“升级此虚拟机”。同样的道理，升级虚拟机也会因兼容性问题而无法开机。**

<br/>

## **附录**

文章参考：

-   [最详细AMD Ryzen CPU，VMware 15安装黑苹果macOS 10.15.x Catalina 记录](https://blog.csdn.net/xiaocheng0404/article/details/106963575)

<br/>