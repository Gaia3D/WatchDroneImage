# -*- coding: utf-8 -*-
#===============================================================================
# os.listdir(path)
# 1. path를 넣으면, 그 path에 있는 폴더이름 및 파일이름을 list로 리턴
# 2. '.' 이나 '..'은 무시됨
# 3. path가 unicode라면, 리턴되는 list도 unicode 타입
#===============================================================================


import time
import os


class MonitorChanges():

    dName = "d:\\tmp"
    fNames = ['qwer.txt', 'asdf.txt']
    mTimes = [0,0]
    bTimes = [0,0]
    changedFiles = [0,0]

    fnm = ""
    index = 0
    mainFlag = True;
    beginChange = False; 

    def __init__(self):
        for fName in self.fNames :
            print fName
            if os.path.exists('%s/%s' % (self.dName, fName)):
                self.bTimes[self.index] = os.path.getmtime('%s/%s' % (self.dName, fName))
            
            print "기존 파일 수정 시간 %f" % self.bTimes[self.index]
            self.index = self.index + 1
            
            
        for bTime in self.bTimes:
            print "저장된 시간 : %lf" % bTime
        
        self.monitor()
        
    
    def monitor(self):
        while self.mainFlag:
            
            index = 0
            for fName in self.fNames:
                if os.path.exists('%s/%s' % (self.dName, fName)):
                    mTime = os.path.getmtime('%s/%s' % (self.dName, fName))
                else :
                    mTime = 0
                #print "시간 비교를 시작합니다.. : %s %s %f %f" % (fName, self.fNames[index], self.bTimes[index], mTime)     # 파일이 변경된 시간
                if((not os.path.exists('%s/%s' % (self.dName, fName))) or (self.bTimes[index] == mTime)):
                    print "아무 변동이 없습니다 : %s %s %f %f" % (fName, self.fNames[index], self.bTimes[index], mTime)     # 파일이 변경된 시간
                    #mainFlag = False
                else : 
                    print "파일 변경이 시작되었습니다!! : %s %f %f" % (self.fNames[index], self.bTimes[index], mTime)     # 파일이 변경된 시간
                    self.mainFlag = False
                    
                    
                    self.monitorModify()
                    break
                    
                index = index + 1;
            
            
            time.sleep(3)

    def monitorModify(self):
        print
        
        modifyFlag = True
        

        while modifyFlag :
             
            time.sleep(3)
        
            index = 0
            for fName in self.fNames:
                if os.path.exists('%s/%s' % (self.dName, fName)):
                    #aTime = os.path.getatime('%s/%s' % (self.dName, fName))
                    mTime = os.path.getmtime('%s/%s' % (self.dName, fName))
                    print
                    print "시간 변화 : %s %f %f" % (self.fNames[index], self.bTimes[index], mTime)
                #print "파일 변동정보를 검색니다.. : %s %s %f %f" % (fName, self.fNames[index], self.bTimes[index], mTime)     # 파일이 변경된 시간
                if((os.path.exists('%s/%s' % (self.dName, fName))) and (self.bTimes[index] == mTime)):
                    print "%s 파일 업로드 중입니다 :" % fName 
                    self.bTimes[index] = mTime
                    #mainFlag = False
                else : 
                    self.bTimes[index] = mTime
                    print "%s 파일 업로드가 완료되었습니다!!" % fName
                    #modifyFlag = False
                    
                    self.changedFiles[index] = 1
                    
                    
                index = index + 1;

            changeFlag = True
            for changeFile in self.changedFiles:
                print changeFile
                if changeFile == 0 :
                    changeFlag = False
                    break
            
            if changeFlag :
                if self.beginChange :
                    modifyFlag = False
                    self.changeIndex()
                    
                else : 
                    self.beginChange = True
                    
                    index = 0
                    for changeFile in self.changedFiles:
                        self.changedFiles[index] = 0
                        index = index + 1
    
    
    def changeIndex(self):
        print 'start changeIndex.....'
        print 'start changeIndex.....'
        print 'start changeIndex.....'
        print 'start changeIndex.....'
        
        

monitorChanges = MonitorChanges()